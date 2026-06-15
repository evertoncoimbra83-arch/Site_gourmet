import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveDeliveryCoverage, globalShippingValidator } from "./shippingService.js";

// Mock do db.js
const dbMock = vi.hoisted(() => {
  return {
    query: {
      appConfigs: {
        findFirst: vi.fn(),
      },
      shippingZones: {
        findMany: vi.fn(),
      },
    },
    execute: vi.fn(),
  };
});

vi.mock("../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

// Mock do encryption.js preservando os tipos originais (ex: encryptedText)
vi.mock("../encryption.js", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    encrypt: vi.fn((val) => val),
    decrypt: vi.fn((val) => val),
    normalizeDigits: vi.fn((val) => val ? val.replace(/\D/g, "") : val),
  };
});

// Mock global do fetch
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("Shipping Service - resolveDeliveryCoverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();

    // Default mock para appConfigs
    dbMock.query.appConfigs.findFirst.mockResolvedValue({
      configKey: "store_address_jundiai",
      configValue: JSON.stringify({
        allowedCities: ["Jundiaí", "Itupeva"],
        minOrderValue: 50.00,
        minOrderMessage: "Pedido mínimo de R$ 50,00 para entrega.",
      }),
    });

    // Default mock para execute (geo_mesh vazio)
    dbMock.execute.mockResolvedValue([]);
  });

  it("deve permitir CEP coberto em faixa de CEP direta (zipcode)", async () => {
    // Regra direta para CEPs 13200-000 até 13215-999
    dbMock.query.shippingZones.findMany.mockResolvedValue([
      {
        id: 10,
        name: "Zona Centro",
        storeSlug: "jundiai",
        type: "zipcode",
        zipCodeStart: "13200000",
        zipCodeEnd: "13215999",
        shippingCost: "15.00",
        estimatedDays: 2,
        isActive: true,
      },
    ]);

    const res = await resolveDeliveryCoverage({ cep: "13.201-000", storeSlug: "jundiai" });

    expect(res.allowed).toBe(true);
    expect(res.fee).toBe(15.00);
    expect(res.zoneId).toBe(10);
    expect(res.source).toBe("zipcode");
    expect(res.minimumOrderValue).toBe(50.00);
  });

  it("deve rejeitar CEP se a regra correspondente estiver inativa", async () => {
    // A query no banco filtra por isActive: true, logo a regra inativa não será retornada
    dbMock.query.shippingZones.findMany.mockResolvedValue([]);

    // CEP não cadastrado na geo_mesh e viacep indisponível
    fetchMock.mockResolvedValue({
      json: async () => ({ erro: true }),
    });

    const res = await resolveDeliveryCoverage({ cep: "13201000", storeSlug: "jundiai" });
    expect(res.allowed).toBe(false);
  });

  it("deve aceitar CEP se já existir registro válido na geo_mesh", async () => {
    dbMock.query.shippingZones.findMany.mockResolvedValue([
      {
        id: 12,
        name: "Zona Principal",
        storeSlug: "jundiai",
        type: "zipcode",
        zipCodeStart: "00000000",
        zipCodeEnd: "00000000",
        shippingCost: "10.00",
        isActive: true,
      }
    ]);

    // Simula geo_mesh contendo o CEP
    dbMock.execute.mockResolvedValue([
      [
        {
          cep: "13205000",
          price: "12.50",
          lat: "-23.18",
          lng: "-46.88",
        },
      ],
    ]);

    const res = await resolveDeliveryCoverage({ cep: "13205000", storeSlug: "jundiai" });

    expect(res.allowed).toBe(true);
    expect(res.fee).toBe(12.50);
    expect(res.source).toBe("geoMesh");
  });

  it("deve permitir CEP via city bypass se a cidade for permitida", async () => {
    dbMock.query.shippingZones.findMany.mockResolvedValue([
      {
        id: 15,
        name: "Regra Geral",
        storeSlug: "jundiai",
        type: "zipcode",
        zipCodeStart: "00000000",
        zipCodeEnd: "00000000",
        shippingCost: "18.00",
        isActive: true,
      },
    ]);

    // Simula ViaCEP retornando Itupeva (cidade permitida no appConfigs)
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("viacep")) {
        return {
          json: async () => ({
            localidade: "Itupeva",
            uf: "SP",
            bairro: "Centro",
            logradouro: "Rua Direta",
          }),
        };
      }
      // Nominatim falha ou retorna vazio
      return {
        json: async () => ([]),
      };
    });

    const res = await resolveDeliveryCoverage({ cep: "13295-000", storeSlug: "jundiai" });

    expect(res.allowed).toBe(true);
    expect(res.cityAllowed).toBe(true);
    expect(res.fee).toBe(18.00);
    expect(res.source).toBe("cityBypass");
    expect(dbMock.execute).toHaveBeenCalled(); // Verifica se salvou na geo_mesh
  });

  it("deve rejeitar CEP se a cidade não for permitida", async () => {
    dbMock.query.shippingZones.findMany.mockResolvedValue([
      {
        id: 15,
        name: "Regra Geral",
        storeSlug: "jundiai",
        type: "zipcode",
        zipCodeStart: "00000000",
        zipCodeEnd: "00000000",
        shippingCost: "18.00",
        isActive: true,
      },
    ]);

    // Simula ViaCEP retornando Campinas (cidade não permitida)
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("viacep")) {
        return {
          json: async () => ({
            localidade: "Campinas",
            uf: "SP",
            bairro: "Taquaral",
          }),
        };
      }
      return { json: async () => ([]) };
    });

    const res = await resolveDeliveryCoverage({ cep: "13087-000", storeSlug: "jundiai" });

    expect(res.allowed).toBe(false);
    expect(res.cityAllowed).toBe(false);
    expect(res.source).toBe("city_denied");
  });

  it("deve gerar o mesmo resultado para CEP com ou sem máscara", async () => {
    dbMock.query.shippingZones.findMany.mockResolvedValue([
      {
        id: 10,
        name: "Zona Centro",
        storeSlug: "jundiai",
        type: "zipcode",
        zipCodeStart: "13200000",
        zipCodeEnd: "13215999",
        shippingCost: "15.00",
        isActive: true,
      },
    ]);

    const resComMascara = await resolveDeliveryCoverage({ cep: "13.201-000" });
    const resSemMascara = await resolveDeliveryCoverage({ cep: "13201000" });

    expect(resComMascara.allowed).toBe(resSemMascara.allowed);
    expect(resComMascara.fee).toBe(resSemMascara.fee);
    expect(resComMascara.normalizedCep).toBe("13201000");
    expect(resSemMascara.normalizedCep).toBe("13201000");
  });

  it("deve rejeitar CEP malformado ou vazio", async () => {
    const resVazio = await resolveDeliveryCoverage({ cep: "" });
    const resCurto = await resolveDeliveryCoverage({ cep: "1320" });

    expect(resVazio.allowed).toBe(false);
    expect(resCurto.allowed).toBe(false);
  });
});

describe("Shipping Service - globalShippingValidator Compatibility Wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.query.appConfigs.findFirst.mockResolvedValue({
      configKey: "store_address_jundiai",
      configValue: JSON.stringify({
        allowedCities: ["Jundiaí"],
        minOrderValue: 40.00,
      }),
    });
    dbMock.query.shippingZones.findMany.mockResolvedValue([
      {
        id: 1,
        shippingCost: "10.00",
        zipCodeStart: "13200000",
        zipCodeEnd: "13215999",
        type: "zipcode",
        isActive: true,
      }
    ]);
  });

  it("deve retornar o contrato esperado por processShippingResult", async () => {
    const res = await globalShippingValidator("13201000", "jundiai");
    expect(res).toHaveProperty("isValid");
    expect(res).toHaveProperty("cityAllowed");
    expect(res).toHaveProperty("shippingCost");
    expect(res).toHaveProperty("minOrderValue");
    expect(res.shippingCost).toBe(10.00);
    expect(res.minOrderValue).toBe(40.00);
  });
});
