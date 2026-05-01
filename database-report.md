# 📊 Relatório Detalhado do Banco de Dados: `gourmet_saudavel`

**Data da Geração:** 09/12/2025, 21:14:08
**Total de Tabelas:** 26

---

## 📦 Tabela: `__drizzle_migrations`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | bigint unsigned | ❌ | 🔑 PK | NULL | auto_increment |
| **hash** | text | ❌ |  | NULL |  |
| **created_at** | bigint | ✅ |  | NULL |  |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "hash": "f5bf6cadd18d267b7e8f3739cab14800667e2c2e57363e089dad7f8caafb43f8",
    "created_at": 1764097772202
  },
  {
    "id": 2,
    "hash": "fac41446306c1991e1fc9a4c9f194c20056a3b62bbdc07cc1496931ab122d1cf",
    "created_at": 1764110456063
  }
]
```

---

## 📦 Tabela: `accompaniment_groups`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **name** | varchar(255) | ❌ |  | NULL |  |
| **slug** | varchar(255) | ❌ | 🦄 UQ | NULL |  |
| **description** | text | ✅ |  | NULL |  |
| **is_active** | tinyint(1) | ✅ |  | `1` |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |
| **updated_at** | timestamp | ✅ |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| **max_selections** | int | ✅ |  | `1` |  |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 4,
    "name": "Acompanhamento 100g",
    "slug": "acompanhamento-100g-1764183895687",
    "description": null,
    "is_active": 1,
    "created_at": "2025-11-26T22:04:56.000Z",
    "updated_at": "2025-11-26T22:18:14.000Z",
    "max_selections": 1
  },
  {
    "id": 6,
    "name": "Acompanhamento 80g",
    "slug": "acompanhamento-80g-1764894934367",
    "description": null,
    "is_active": 1,
    "created_at": "2025-12-05T03:35:34.000Z",
    "updated_at": "2025-12-05T03:35:34.000Z",
    "max_selections": 1
  }
]
```

---

## 📦 Tabela: `accompaniment_options`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **group_id** | int | ❌ | 🔗 FK | NULL |  |
| **name** | varchar(255) | ❌ |  | NULL |  |
| **slug** | varchar(255) | ❌ |  | NULL |  |
| **price_modifier** | decimal(10,2) | ✅ |  | `0.00` |  |
| **display_order** | int | ✅ |  | `0` |  |
| **is_active** | tinyint(1) | ✅ |  | `1` |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |
| **updated_at** | timestamp | ✅ |  | NULL |  |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "group_id": 4,
    "name": "Batata Doce Pure",
    "slug": "batata-doce-pure-1764894311191",
    "price_modifier": "0.00",
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-12-05T03:25:11.000Z",
    "updated_at": "2025-12-05T03:25:11.000Z"
  },
  {
    "id": 8,
    "group_id": 4,
    "name": "Arroz Integral",
    "slug": "arroz-integral-1764894908934",
    "price_modifier": "0.00",
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-12-05T03:35:09.000Z",
    "updated_at": "2025-12-05T03:35:09.000Z"
  },
  {
    "id": 9,
    "group_id": 6,
    "name": "Mix de Legumes",
    "slug": "mix-de-legumes-1764894944003",
    "price_modifier": "0.00",
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-12-05T03:35:44.000Z",
    "updated_at": "2025-12-05T03:35:44.000Z"
  },
  {
    "id": 10,
    "group_id": 6,
    "name": "Brócolis",
    "slug": "brcolis-1764894951539",
    "price_modifier": "0.00",
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-12-05T03:35:52.000Z",
    "updated_at": "2025-12-05T03:35:52.000Z"
  }
]
```

---

## 📦 Tabela: `categories`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **name** | varchar(255) | ❌ |  | NULL |  |
| **slug** | varchar(255) | ❌ | 🦄 UQ | NULL |  |
| **description** | text | ✅ |  | NULL |  |
| **image_url** | varchar(500) | ✅ |  | NULL |  |
| **display_order** | int | ✅ |  | `0` |  |
| **is_active** | tinyint(1) | ✅ |  | `1` |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |
| **updated_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "name": "CadapioPromo",
    "slug": "card-promo",
    "description": null,
    "image_url": null,
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-11-26T01:25:34.000Z",
    "updated_at": "2025-11-26T01:25:34.000Z"
  },
  {
    "id": 2,
    "name": "Peixes",
    "slug": "peixe",
    "description": null,
    "image_url": null,
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-11-26T01:25:34.000Z",
    "updated_at": "2025-11-26T01:25:34.000Z"
  },
  {
    "id": 3,
    "name": "Massas",
    "slug": "massa",
    "description": null,
    "image_url": null,
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-11-26T01:25:34.000Z",
    "updated_at": "2025-11-26T01:25:34.000Z"
  },
  {
    "id": 4,
    "name": "Sopas",
    "slug": "sopas",
    "description": null,
    "image_url": null,
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-11-26T01:25:34.000Z",
    "updated_at": "2025-11-26T01:25:34.000Z"
  },
  {
    "id": 5,
    "name": "Suína",
    "slug": "carne-suina",
    "description": null,
    "image_url": null,
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-11-26T01:25:34.000Z",
    "updated_at": "2025-11-26T01:25:34.000Z"
  },
  {
    "id": 6,
    "name": "Pacotes",
    "slug": "pacotes",
    "description": null,
    "image_url": null,
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-11-26T01:25:34.000Z",
    "updated_at": "2025-11-26T01:25:34.000Z"
  },
  {
    "id": 7,
    "name": "Carne Branca",
    "slug": "carne-branca",
    "description": null,
    "image_url": null,
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-11-26T01:25:34.000Z",
    "updated_at": "2025-11-26T01:25:34.000Z"
  },
  {
    "id": 8,
    "name": "Carne Vermelha",
    "slug": "carne-vermelha",
    "description": null,
    "image_url": null,
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-11-26T01:25:34.000Z",
    "updated_at": "2025-11-26T01:25:34.000Z"
  },
  {
    "id": 9,
    "name": "Vegetariano",
    "slug": "vegetariano",
    "description": null,
    "image_url": null,
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-11-26T01:25:34.000Z",
    "updated_at": "2025-11-26T01:25:34.000Z"
  }
]
```

---

## 📦 Tabela: `coupon_usage`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | bigint unsigned | ❌ | 🔑 PK | NULL | auto_increment |
| **coupon_id** | int | ❌ |  | NULL |  |
| **user_id** | int | ❌ |  | NULL |  |
| **order_id** | int | ✅ |  | NULL |  |
| **used_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |

### Amostra de Dados (Primeiras 10 linhas)

_(Tabela está vazia)_

---

## 📦 Tabela: `coupons`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | bigint unsigned | ❌ | 🔑 PK | NULL | auto_increment |
| **code** | varchar(50) | ❌ | 🦄 UQ | NULL |  |
| **description** | text | ✅ |  | NULL |  |
| **discount_type** | enum('percentage','fixed') | ❌ |  | NULL |  |
| **discount_value** | decimal(10,2) | ❌ |  | NULL |  |
| **min_order_value** | decimal(10,2) | ✅ |  | NULL |  |
| **max_discount** | decimal(10,2) | ✅ |  | NULL |  |
| **usage_limit** | int | ✅ |  | NULL |  |
| **valid_from** | timestamp | ✅ |  | NULL |  |
| **valid_until** | timestamp | ✅ |  | NULL |  |
| **is_active** | tinyint(1) | ✅ |  | `1` |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |

### Amostra de Dados (Primeiras 10 linhas)

_(Tabela está vazia)_

---

## 📦 Tabela: `customer_addresses`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | bigint unsigned | ❌ | 🔑 PK | NULL | auto_increment |
| **user_id** | int | ❌ |  | NULL |  |
| **label** | varchar(100) | ❌ |  | NULL |  |
| **number** | varchar(20) | ✅ |  | NULL |  |
| **complement** | varchar(100) | ✅ |  | NULL |  |
| **neighborhood** | varchar(100) | ❌ |  | NULL |  |
| **city** | varchar(128) | ✅ |  | NULL |  |
| **state** | varchar(128) | ✅ |  | NULL |  |
| **zip_code** | varchar(128) | ✅ |  | NULL |  |
| **phone** | varchar(128) | ✅ |  | NULL |  |
| **is_default** | tinyint(1) | ✅ |  | `0` |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |
| **updated_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| **address** | text | ✅ |  | NULL |  |
| **customer_document** | varchar(50) | ✅ |  | NULL |  |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "user_id": 432,
    "label": "Principal",
    "number": "s/n",
    "complement": "Loja 03 OMO LAVANDERIA",
    "neighborhood": "",
    "city": "Jundiaí",
    "state": "SP",
    "zip_code": "13201-019",
    "phone": "11969535729",
    "is_default": 1,
    "created_at": "2025-12-09T18:43:22.000Z",
    "updated_at": "2025-12-09T18:43:22.000Z",
    "address": "Avenida Nove de Julho, Loja 03 OMO LAVANDERIA",
    "customer_document": null
  },
  {
    "id": 2,
    "user_id": 557,
    "label": "Principal",
    "number": "s/n",
    "complement": "apt. 113A",
    "neighborhood": "",
    "city": "Jundiaí",
    "state": "SP",
    "zip_code": "13208-820",
    "phone": "14997920608",
    "is_default": 1,
    "created_at": "2025-12-09T18:47:11.000Z",
    "updated_at": "2025-12-09T18:47:11.000Z",
    "address": "Rua Elias Juvenal de Mello, apt. 113A",
    "customer_document": null
  },
  {
    "id": 3,
    "user_id": 591,
    "label": "Principal",
    "number": "s/n",
    "complement": "Casa 02",
    "neighborhood": "",
    "city": "Várzea Paulista",
    "state": "SP",
    "zip_code": "13225-572",
    "phone": "11999147641",
    "is_default": 1,
    "created_at": "2025-12-09T18:47:11.000Z",
    "updated_at": "2025-12-09T18:47:11.000Z",
    "address": "Rua Aruá, Casa 02",
    "customer_document": null
  },
  {
    "id": 4,
    "user_id": 155,
    "label": "Principal",
    "number": "s/n",
    "complement": null,
    "neighborhood": "",
    "city": "Jundiaí",
    "state": "SP",
    "zip_code": "13218-682",
    "phone": "11971186868",
    "is_default": 1,
    "created_at": "2025-12-09T18:47:11.000Z",
    "updated_at": "2025-12-09T18:47:11.000Z",
    "address": "Rua José Fontebasso",
    "customer_document": null
  },
  {
    "id": 5,
    "user_id": 588,
    "label": "Principal",
    "number": "s/n",
    "complement": "Bar e Mercearia MR Rossi",
    "neighborhood": "",
    "city": "Jundiaí",
    "state": "SP",
    "zip_code": "13218-300",
    "phone": "'+5511976539548",
    "is_default": 1,
    "created_at": "2025-12-09T18:47:11.000Z",
    "updated_at": "2025-12-09T18:47:11.000Z",
    "address": "Avenida Yolanda Ferreira Breda, Bar e Mercearia MR Rossi",
    "customer_document": null
  },
  {
    "id": 6,
    "user_id": 313,
    "label": "Principal",
    "number": "s/n",
    "complement": "Torre 05 Apto 117",
    "neighborhood": "",
    "city": "Jundiaí",
    "state": "SP",
    "zip_code": "13219-071",
    "phone": "17991897651",
    "is_default": 1,
    "created_at": "2025-12-09T18:47:11.000Z",
    "updated_at": "2025-12-09T18:47:11.000Z",
    "address": "Rua Ângelo Corradini, Torre 05 Apto 117",
    "customer_document": null
  },
  {
    "id": 7,
    "user_id": 563,
    "label": "Principal",
    "number": "s/n",
    "complement": null,
    "neighborhood": "",
    "city": "Jundiaí",
    "state": "SP",
    "zip_code": "13218-111",
    "phone": "'+5511982293125",
    "is_default": 1,
    "created_at": "2025-12-09T18:47:11.000Z",
    "updated_at": "2025-12-09T18:47:11.000Z",
    "address": "Rua Doutor Antenor Soares Gandra",
    "customer_document": null
  },
  {
    "id": 8,
    "user_id": 593,
    "label": "Principal",
    "number": "s/n",
    "complement": "Ap1403",
    "neighborhood": "",
    "city": "Varzea paulista",
    "state": "SP",
    "zip_code": "13225-750",
    "phone": "11963829755",
    "is_default": 1,
    "created_at": "2025-12-09T18:47:11.000Z",
    "updated_at": "2025-12-09T18:47:11.000Z",
    "address": "Rua Primeiro de Maio, Ap1403",
    "customer_document": null
  },
  {
    "id": 9,
    "user_id": 44,
    "label": "Principal",
    "number": "s/n",
    "complement": "CASA",
    "neighborhood": "",
    "city": "Jundiaí",
    "state": "SP",
    "zip_code": "13203-541",
    "phone": "11963585906",
    "is_default": 1,
    "created_at": "2025-12-09T18:47:11.000Z",
    "updated_at": "2025-12-09T18:47:11.000Z",
    "address": "Rua Juracy Paupério, CASA",
    "customer_document": null
  },
  {
    "id": 10,
    "user_id": 558,
    "label": "Principal",
    "number": "s/n",
    "complement": "Ap 123C",
    "neighborhood": "",
    "city": "Jundiaí",
    "state": "SP",
    "zip_code": "13215-741",
    "phone": "18997972726",
    "is_default": 1,
    "created_at": "2025-12-09T18:47:11.000Z",
    "updated_at": "2025-12-09T18:47:11.000Z",
    "address": "Rua Irineu de Toledo, Ap 123C",
    "customer_document": null
  }
]
```

---

## 📦 Tabela: `dish_sizes`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **name** | varchar(100) | ❌ |  | NULL |  |
| **weight** | varchar(50) | ✅ |  | NULL |  |
| **price_modifier** | decimal(10,2) | ✅ |  | `0.00` |  |
| **no_accompaniments_message** | varchar(255) | ✅ |  | NULL |  |
| **display_order** | int | ✅ |  | `0` |  |
| **is_active** | tinyint(1) | ✅ |  | `1` |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |
| **updated_at** | timestamp | ✅ |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "name": "400g",
    "weight": null,
    "price_modifier": "0.00",
    "no_accompaniments_message": "Sem acompanhamenteo será enviado 200g.",
    "display_order": 0,
    "is_active": 1,
    "created_at": "2025-11-27T01:32:28.000Z",
    "updated_at": "2025-12-05T03:36:23.000Z"
  }
]
```

---

## 📦 Tabela: `dishes`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ |  | `0` |  |
| **woocommerce_id** | int | ✅ |  | NULL |  |
| **name** | varchar(255) | ❌ |  | NULL |  |
| **slug** | varchar(255) | ❌ |  | NULL |  |
| **description** | text | ✅ |  | NULL |  |
| **image_url** | varchar(500) | ✅ |  | NULL |  |
| **base_price** | decimal(10,2) | ❌ |  | NULL |  |
| **category_id** | int | ✅ |  | NULL |  |
| **is_active** | tinyint(1) | ✅ |  | `1` |  |
| **nutritional_info** | json | ✅ |  | NULL |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |
| **updated_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "woocommerce_id": null,
    "name": "Tilápia ao Molho Gorgonzola",
    "slug": "tilpia-ao-molho-gorgonzola",
    "description": "Filé de tilápia grelhada acompanhada de molho a base de gorgonzola.",
    "image_url": "https://gourmetsaudavel.com/wp-content/uploads/2020/05/tilapia-gorgonzola.png",
    "base_price": "41.54",
    "category_id": 2,
    "is_active": 1,
    "nutritional_info": {
      "carbs": {
        "dv": "0",
        "value": "1,4"
      },
      "fiber": {
        "dv": "0",
        "value": "0"
      },
      "energy": {
        "dv": "5",
        "value": "103Kcal=431kJ"
      },
      "sodium": {
        "dv": "3",
        "value": "73"
      },
      "protein": {
        "dv": "24",
        "value": "18"
      },
      "fat_total": {
        "dv": "5",
        "value": "2,6"
      },
      "fat_trans": {
        "dv": "**",
        "value": "0"
      },
      "fat_saturated": {
        "dv": "6",
        "value": "1,4"
      }
    },
    "created_at": "2025-11-26T04:25:49.000Z",
    "updated_at": "2025-12-02T20:47:30.000Z"
  },
  {
    "id": 2,
    "woocommerce_id": null,
    "name": "Nhoque de cenoura",
    "slug": "nhoque-de-cenoura",
    "description": "Nhoque de batata doce feito a base de farinha sem glúten e sem lactose,acompanhado de molho gorgonzola e queijo parmesão.\r\n[su_accordion class=\"\"]\r\n[su_spoiler title=\"Ingredientes\" open=\"no\" style=\"default\" icon=\"plus\" anchor=\"\" class=\"\"]\r\nIngredient",
    "image_url": null,
    "base_price": "38.56",
    "category_id": 3,
    "is_active": 1,
    "nutritional_info": null,
    "created_at": "2025-11-26T04:25:49.000Z",
    "updated_at": "2025-11-26T04:25:49.000Z"
  },
  {
    "id": 3,
    "woocommerce_id": null,
    "name": "Proteína de soja com grão de bico",
    "slug": "protena-de-soja-com-gro-de-bico",
    "description": "Proteína de soja acompanhada de cenoura ralada,grão de bico e pimentão vermelho.",
    "image_url": null,
    "base_price": "32.11",
    "category_id": 9,
    "is_active": 1,
    "nutritional_info": {
      "carbs": {
        "dv": "7",
        "value": "20"
      },
      "fiber": {
        "dv": "16",
        "value": "3,9"
      },
      "energy": {
        "dv": "10",
        "value": "204Kcal=854kJ"
      },
      "sodium": {
        "dv": "24",
        "value": "579"
      },
      "protein": {
        "dv": "21",
        "value": "15"
      },
      "fat_total": {
        "dv": "14",
        "value": "7,5"
      },
      "fat_trans": {
        "dv": "**",
        "value": "0"
      },
      "fat_saturated": {
        "dv": "5",
        "value": "1,2"
      }
    },
    "created_at": "2025-11-26T04:25:49.000Z",
    "updated_at": "2025-11-26T01:26:24.000Z"
  },
  {
    "id": 4,
    "woocommerce_id": null,
    "name": "Proteína  de soja com palmito",
    "slug": "protena-de-soja-com-palmito",
    "description": "Proteína de soja acompanhada de palmito,tomate e molho de shoyo.",
    "image_url": "https://gourmetsaudavel.com/wp-content/uploads/2021/01/Proteina_Soja_Palmito.png",
    "base_price": "25.37",
    "category_id": 9,
    "is_active": 1,
    "nutritional_info": {
      "carbs": {
        "dv": "3",
        "value": "7,7"
      },
      "fiber": {
        "dv": "6",
        "value": "1,6"
      },
      "energy": {
        "dv": "5",
        "value": "105Kcal=440kJ"
      },
      "sodium": {
        "dv": "17",
        "value": "414"
      },
      "protein": {
        "dv": "17",
        "value": "12"
      },
      "fat_total": {
        "dv": "6",
        "value": "3,1"
      },
      "fat_trans": {
        "dv": "**",
        "value": "0"
      },
      "fat_saturated": {
        "dv": "2",
        "value": "0,5"
      }
    },
    "created_at": "2025-11-26T04:25:49.000Z",
    "updated_at": "2025-12-02T20:47:30.000Z"
  },
  {
    "id": 5,
    "woocommerce_id": null,
    "name": "Tilápia ao Molho de Cream Cheese e Dill",
    "slug": "tilpia-ao-molho-de-cream-cheese-e-dill",
    "description": "A Tilápia ao Molho de Cream Cheese e Dill é um prato delicioso e saudável. É preparado com filetes de tilápia frescos, assadosl. O molho é feito com cream cheese, cebola, alho, suco de limão, azeite, manjericão, salsa, dill e sal. O molho é então des",
    "image_url": "https://gourmetsaudavel.com/wp-content/uploads/2020/05/tilapia-molho-dill.png",
    "base_price": "41.54",
    "category_id": 2,
    "is_active": 1,
    "nutritional_info": {
      "carbs": {
        "dv": "1",
        "value": "3,2"
      },
      "fiber": {
        "dv": "0",
        "value": "0"
      },
      "energy": {
        "dv": "5",
        "value": "94Kcal=394kJ"
      },
      "sodium": {
        "dv": "3",
        "value": "77"
      },
      "protein": {
        "dv": "16",
        "value": "12"
      },
      "fat_total": {
        "dv": "7",
        "value": "3,6"
      },
      "fat_trans": {
        "dv": "**",
        "value": "0"
      },
      "fat_saturated": {
        "dv": "10",
        "value": "2,1"
      }
    },
    "created_at": "2025-11-26T04:25:49.000Z",
    "updated_at": "2025-12-02T20:47:30.000Z"
  },
  {
    "id": 6,
    "woocommerce_id": null,
    "name": "Almôndega de Carne",
    "slug": "almndega-de-carne",
    "description": "A Almôndega de Carne é um alimento delicioso e versátil, feito com carne moída, temperos e especiarias. É um prato tradicional em muitas culturas, como a italiana, alemã e brasileira. É um alimento nutritivo e saboroso, que pode ser servido como aper",
    "image_url": "https://gourmetsaudavel.com/wp-content/uploads/2021/01/AlmondegaPatinho.png",
    "base_price": "21.16",
    "category_id": 8,
    "is_active": 1,
    "nutritional_info": {
      "carbs": {
        "dv": "3",
        "value": "8,7"
      },
      "fiber": {
        "dv": "6",
        "value": "1,6"
      },
      "energy": {
        "dv": "7",
        "value": "140Kcal=586kJ"
      },
      "sodium": {
        "dv": "5",
        "value": "113"
      },
      "protein": {
        "dv": "23",
        "value": "17"
      },
      "fat_total": {
        "dv": "6",
        "value": "3,3"
      },
      "fat_trans": {
        "dv": "**",
        "value": "0"
      },
      "fat_saturated": {
        "dv": "7",
        "value": "1,5"
      }
    },
    "created_at": "2025-11-26T04:25:49.000Z",
    "updated_at": "2025-12-02T20:47:30.000Z"
  },
  {
    "id": 7,
    "woocommerce_id": null,
    "name": "Fricassê de Carne Bovina(Patinho)",
    "slug": "fricass-de-carne-bovinapatinho",
    "description": "O Fricassê de Carne Bonvina é um prato delicioso e nutritivo, feito com carne de patinho magra, temperada com ervas e especiarias. É um prato muito versátil, pois pode ser servido como prato principal ou como acompanhamento. A carne é cozida lentamen",
    "image_url": "https://gourmetsaudavel.com/wp-content/uploads/2019/12/14_full.png",
    "base_price": "25.76",
    "category_id": 8,
    "is_active": 1,
    "nutritional_info": {
      "carbs": {
        "dv": "2",
        "value": "5,9"
      },
      "fiber": {
        "dv": "0",
        "value": "0"
      },
      "energy": {
        "dv": "8",
        "value": "155Kcal=649kJ"
      },
      "sodium": {
        "dv": "12",
        "value": "291"
      },
      "protein": {
        "dv": "22",
        "value": "16"
      },
      "fat_total": {
        "dv": "13",
        "value": "6,9"
      },
      "fat_trans": {
        "dv": "**",
        "value": "0"
      },
      "fat_saturated": {
        "dv": "17",
        "value": "3,8"
      }
    },
    "created_at": "2025-11-26T04:25:49.000Z",
    "updated_at": "2025-12-02T20:47:30.000Z"
  },
  {
    "id": 8,
    "woocommerce_id": null,
    "name": "Filé de Frango ao Molho Dourado",
    "slug": "fil-de-frango-ao-molho-dourado",
    "description": "O Filé de Frango ao Molho Dourado é um prato delicioso e saudável, feito com filés de frango frescos e crocantes, cobertos com um molho cremoso e dourado feito com milho verde. O frango é temperado com sal, pimenta e ervas frescas, e é servido com um",
    "image_url": "https://gourmetsaudavel.com/wp-content/uploads/2020/01/prato-frango-molho-dourado.png",
    "base_price": "25.37",
    "category_id": 7,
    "is_active": 1,
    "nutritional_info": {
      "carbs": {
        "dv": "3",
        "value": "7,5"
      },
      "fiber": {
        "dv": "4",
        "value": "1,1"
      },
      "energy": {
        "dv": "7",
        "value": "137Kcal=574kJ"
      },
      "sodium": {
        "dv": "5",
        "value": "111"
      },
      "protein": {
        "dv": "23",
        "value": "17"
      },
      "fat_total": {
        "dv": "9",
        "value": "4,7"
      },
      "fat_trans": {
        "dv": "**",
        "value": "0"
      },
      "fat_saturated": {
        "dv": "5",
        "value": "1,1"
      }
    },
    "created_at": "2025-11-26T04:25:49.000Z",
    "updated_at": "2025-12-02T20:47:30.000Z"
  },
  {
    "id": 9,
    "woocommerce_id": null,
    "name": "Escondidinho de Batata Doce(Frango)",
    "slug": "escondidinho-de-batata-docefrango",
    "description": "O Escondidinho de Batata Doce com Peito de Frango é um prato delicioso e saudável. É feito com camadas de batata doce assada e leite de coco. O recheio é feito com peito de frango desfiado, cebola, alho, azeite e páprica. É uma ótima opção para quem ",
    "image_url": "https://gourmetsaudavel.com/wp-content/uploads/2020/03/15_full.png",
    "base_price": "25.37",
    "category_id": 7,
    "is_active": 1,
    "nutritional_info": {
      "carbs": {
        "dv": "3",
        "value": "9,4"
      },
      "fiber": {
        "dv": "4",
        "value": "1,1"
      },
      "energy": {
        "dv": "8",
        "value": "157Kcal=657kJ"
      },
      "sodium": {
        "dv": "2",
        "value": "45"
      },
      "protein": {
        "dv": "19",
        "value": "14"
      },
      "fat_total": {
        "dv": "13",
        "value": "7,4"
      },
      "fat_trans": {
        "dv": "**",
        "value": "0"
      },
      "fat_saturated": {
        "dv": "15",
        "value": "3,3"
      }
    },
    "created_at": "2025-11-26T04:25:49.000Z",
    "updated_at": "2025-12-02T20:47:30.000Z"
  },
  {
    "id": 10,
    "woocommerce_id": null,
    "name": "Escondidinho de  Mandioquinha(Frango)",
    "slug": "escondidinho-de-mandioquinhafrango",
    "description": "O Escondidinho de Mandioquinha com Peito de Frango é um prato delicioso e nutritivo. É feito com mandioquinha cozida, desfiado de peito de frango, cebola, alho, azeite, sal e temperos a gosto. A mandioquinha é cozida e amassada, formando uma base par",
    "image_url": "https://gourmetsaudavel.com/wp-content/uploads/2020/03/17_full.png",
    "base_price": "25.37",
    "category_id": 7,
    "is_active": 1,
    "nutritional_info": {
      "carbs": {
        "dv": "3",
        "value": "9,4"
      },
      "fiber": {
        "dv": "4",
        "value": "1,1"
      },
      "energy": {
        "dv": "8",
        "value": "157Kcal=657kJ"
      },
      "sodium": {
        "dv": "2",
        "value": "45"
      },
      "protein": {
        "dv": "19",
        "value": "14"
      },
      "fat_total": {
        "dv": "13",
        "value": "7,4"
      },
      "fat_trans": {
        "dv": "**",
        "value": "0"
      },
      "fat_saturated": {
        "dv": "15",
        "value": "3,3"
      }
    },
    "created_at": "2025-11-26T04:25:49.000Z",
    "updated_at": "2025-12-02T20:47:30.000Z"
  }
]
```

---

## 📦 Tabela: `food_card_brands`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | bigint unsigned | ❌ | 🔑 PK | NULL | auto_increment |
| **name** | varchar(100) | ❌ |  | NULL |  |
| **is_active** | tinyint(1) | ✅ |  | `1` |  |
| **display_order** | int | ❌ |  | `0` |  |

### Amostra de Dados (Primeiras 10 linhas)

_(Tabela está vazia)_

---

## 📦 Tabela: `loyalty_history`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **user_id** | int | ❌ | 🔗 FK | NULL |  |
| **points_change** | int | ❌ |  | NULL |  |
| **reason** | varchar(255) | ✅ |  | NULL |  |
| **order_id** | int | ✅ |  | NULL |  |
| **description** | text | ✅ |  | NULL |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "user_id": 1,
    "points_change": 100,
    "reason": "admin-adjustment",
    "order_id": null,
    "description": "Importado do WooCommerce",
    "created_at": "2020-03-16T03:39:16.000Z"
  },
  {
    "id": 2,
    "user_id": 1,
    "points_change": 100,
    "reason": "admin_action",
    "order_id": null,
    "description": "Teste",
    "created_at": "2020-03-16T00:46:57.000Z"
  },
  {
    "id": 33,
    "user_id": 1,
    "points_change": 800,
    "reason": "admin_action",
    "order_id": null,
    "description": "teste",
    "created_at": "2023-06-27T14:28:46.000Z"
  },
  {
    "id": 34,
    "user_id": 1,
    "points_change": -800,
    "reason": "shared_points",
    "order_id": null,
    "description": "Created coupon: krbm-hqwx-qdsc",
    "created_at": "2023-06-27T14:30:57.000Z"
  },
  {
    "id": 37,
    "user_id": 1,
    "points_change": -308,
    "reason": "shared_points",
    "order_id": null,
    "description": "Cupom criado: f0pa-vsqm-hfk0",
    "created_at": "2024-02-22T12:42:35.000Z"
  },
  {
    "id": 43,
    "user_id": 3,
    "points_change": 207,
    "reason": "admin_action",
    "order_id": null,
    "description": "Pontuação Último Pedido",
    "created_at": "2020-03-23T14:11:25.000Z"
  },
  {
    "id": 49,
    "user_id": 4,
    "points_change": 304,
    "reason": "admin_action",
    "order_id": null,
    "description": "Compra 17/03",
    "created_at": "2020-04-03T09:30:28.000Z"
  },
  {
    "id": 61,
    "user_id": 7,
    "points_change": 93,
    "reason": "admin_action",
    "order_id": null,
    "description": "Pedido #6072",
    "created_at": "2020-04-09T19:47:35.000Z"
  },
  {
    "id": 134,
    "user_id": 24,
    "points_change": 194,
    "reason": "order_refund",
    "order_id": null,
    "description": "9409",
    "created_at": "2021-05-28T00:30:40.000Z"
  },
  {
    "id": 136,
    "user_id": 24,
    "points_change": -194,
    "reason": "order_completed",
    "order_id": null,
    "description": "9409",
    "created_at": "2021-05-28T19:58:11.000Z"
  }
]
```

---

## 📦 Tabela: `loyalty_settings`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **enabled** | tinyint(1) | ✅ |  | `1` |  |
| **conversion_rate_points** | int | ✅ |  | `50` |  |
| **conversion_rate_money** | decimal(10,2) | ✅ |  | `1.00` |  |
| **max_discount_amount** | decimal(10,2) | ✅ |  | `50.00` |  |
| **min_cart_amount** | decimal(10,2) | ✅ |  | `0.00` |  |
| **min_discount_required** | decimal(10,2) | ✅ |  | `0.00` |  |
| **updated_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| **redemption_rate_points** | int | ✅ |  | `100` |  |
| **redemption_rate_money** | decimal(10,2) | ✅ |  | `1.00` |  |
| **points_expiration_days** | int | ✅ |  | `365` |  |
| **points_per_signup** | int | ✅ |  | `0` |  |
| **points_per_review** | int | ✅ |  | `0` |  |
| **general_min_order_amount** | decimal(10,2) | ✅ |  | `0.00` |  |
| **min_order_message** | text | ✅ |  | NULL |  |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "enabled": 1,
    "conversion_rate_points": 50,
    "conversion_rate_money": "1.00",
    "max_discount_amount": "50.00",
    "min_cart_amount": "0.00",
    "min_discount_required": "0.00",
    "updated_at": "2025-11-26T01:53:11.000Z",
    "redemption_rate_points": 100,
    "redemption_rate_money": "1.00",
    "points_expiration_days": 365,
    "points_per_signup": 0,
    "points_per_review": 0,
    "general_min_order_amount": "0.00",
    "min_order_message": null
  }
]
```

---

## 📦 Tabela: `media_library`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | bigint unsigned | ❌ | 🔑 PK | NULL | auto_increment |
| **url** | varchar(512) | ❌ |  | NULL |  |
| **mime_type** | varchar(50) | ✅ |  | NULL |  |
| **uploaded_by** | int | ✅ |  | NULL |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |
| **file_name** | varchar(255) | ❌ |  | NULL |  |
| **size** | int | ✅ |  | NULL |  |
| **alt_text** | varchar(255) | ✅ |  | NULL |  |
| **title** | varchar(255) | ✅ |  | NULL |  |

### Amostra de Dados (Primeiras 10 linhas)

_(Tabela está vazia)_

---

## 📦 Tabela: `order_items`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | bigint unsigned | ❌ | 🔑 PK | NULL | auto_increment |
| **order_id** | int | ❌ |  | NULL |  |
| **dish_id** | int | ❌ |  | NULL |  |
| **dish_name** | varchar(255) | ❌ |  | NULL |  |
| **size_name** | varchar(100) | ❌ |  | NULL |  |
| **quantity** | int | ❌ |  | NULL |  |
| **base_price** | decimal(10,2) | ❌ |  | NULL |  |
| **final_price** | decimal(10,2) | ❌ |  | NULL |  |
| **accompaniments_snapshot** | json | ✅ |  | NULL |  |
| **size_id** | int | ✅ |  | NULL |  |
| **options_json** | text | ✅ |  | NULL |  |
| **comment** | varchar(255) | ✅ |  | NULL |  |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "order_id": 3,
    "dish_id": 25338,
    "dish_name": "Pacote 300 e 200g",
    "size_name": "200g",
    "quantity": 1,
    "base_price": "151.61",
    "final_price": "151.61",
    "accompaniments_snapshot": "{\"Opçao 1(300g)\":\"Escondidinho de Mandioquinha(Patinho)\",\"Opçao 1(300g) - Acomp. 1\":\"Arroz Branco\",\"Opçao 1(300g) - Acomp. 2\":\"Mix de Legumes\",\"Opçao 2(300g)\":\"Patinho desfiado\",\"Opçao 2(300g) - Acomp. 1\":\"Arroz Integral\",\"Opçao 2(300g) - Acomp. 2\":\"Abobrinha Refogada\",\"Opçao 3(300g)\":\"Escondidinho de Mandioquinha(Patinho)\",\"Opçao 3(300g) - Acomp. 1\":\"Arroz Integral\",\"Opçao 3(300g) - Acomp. 2\":\"Mix de Legumes\",\"Opçao 4(300g)\":\"Carne Louca\",\"Opçao 4(300g) - Acomp. 1\":\"Arroz Branco\",\"Opçao 4(300g) - Acomp. 2\":\"Feijão\",\"Opçao 5(300g)\":\"Picadinho de Patinho com Grão de Bico\",\"Opçao 5(300g) - Acomp. 1\":\"Arroz Integral\",\"Opçao 5(300g) - Acomp. 2\":\"Mix de Legumes\",\"Opçao 6(200g)\":\"Estrogonofe de Frango\",\"Opçao 6(200g) - Acomp. 1\":\"Arroz Branco\",\"Opçao 7(200g)\":\"Sobrecoxa ao molho de espinafre\",\"Opçao 7(200g) - Acomp. 1\":\"Arroz Integral\",\"Opçao 8(200g)\":\"Escondidinho de Mandioquinha(Patinho)\",\"Opçao 8(200g) - Acomp. 1\":\"Arroz Integral\",\"Opçao 9(200g)\":\"Escondidinho de Mandioquinha(Frango)\",\"Opçao 9(200g) - Acomp. 1\":\"Arroz Integral\",\"Opçao 10(200g)\":\"Patinho desfiado\",\"Opçao 10(200g) - Acomp. 1\":\"Arroz Branco\",\"_ywpar_total_points\":\"151\"}",
    "size_id": null,
    "options_json": null,
    "comment": null
  },
  {
    "id": 2,
    "order_id": 4,
    "dish_id": 25694,
    "dish_name": "Pacote Dia a Dia",
    "size_name": "Padrão",
    "quantity": 1,
    "base_price": "167.63",
    "final_price": "167.63",
    "accompaniments_snapshot": "{\"2 Opção 1(300g)\":\"Patinho desfiado\",\"2 Opção 1(300g) - Acomp. 1\":\"Arroz Integral\",\"2 Opção 1(300g) - Acomp. 2\":\"Mix de Legumes\",\"2 Opção 1(300g) - Acomp. 3\":\"Chuchu Refogado\",\"2 Opção 1(300g) - Acomp. 4\":\"Batata Doce Purê\",\"2 Opção 2(300g)\":\"Peito de Frango Desfiado\",\"2 Opção 2(300g) - Acomp. 1\":\"Arroz Integral\",\"2 Opção 2(300g) - Acomp. 2\":\"Chuchu\",\"2 Opção 2(300g) - Acomp. 3\":\"Batata Doce Purê\",\"2 Opção 2(300g) - Acomp. 4\":\"Abobrinha Refogada\",\"2 Opção 3(300g)\":\"Escondidinho de Batata Doce(Frango)\",\"2 Opção 3(300g) - Acomp. 1\":\"Brocolis\",\"2 Opção 3(300g) - Acomp. 2\":\"Arroz Integral\",\"2 Opção 3(300g) - Acomp. 3\":\"Mix de Legumes\",\"2 Opção 3(300g) - Acomp. 4\":\"Arroz Integral\",\"2 Opção 4(300g)\":\"Carne Louca\",\"2 Opção 4(300g) - Acomp. 1\":\"Arroz Integral\",\"2 Opção 4(300g) - Acomp. 2\":\"Mix de Legumes\",\"2 Opção 4(300g) - Acomp. 3\":\"Arroz Integral\",\"2 Opção 4(300g) - Acomp. 4\":\"Brócolis\",\"2 Opção 5(300g)\":\"Escondidinho de Mandioquinha(Frango)\",\"2 Opção 5(300g) - Acomp. 1\":\"Arroz Integral\",\"2 Opção 5(300g) - Acomp. 2\":\"Mix de Legumes\",\"2 Opção 5(300g) - Acomp. 3\":\"Arroz Integral\",\"2 Opção 5(300g) - Acomp. 4\":\"Brócolis\",\"_ywpar_total_points\":\"167\"}",
    "size_id": null,
    "options_json": null,
    "comment": null
  },
  {
    "id": 3,
    "order_id": 5,
    "dish_id": 5886,
    "dish_name": "Escondidinho de Mandioquinha(Patinho)",
    "size_name": "Padrão",
    "quantity": 1,
    "base_price": "25.76",
    "final_price": "25.76",
    "accompaniments_snapshot": "{\"Acompanhamento 120g\":\"Arroz Branco\",\"Acompanhamento 100g\":\"Abobirnha Refogada\",\"_ywpar_total_points\":\"25\"}",
    "size_id": null,
    "options_json": null,
    "comment": null
  },
  {
    "id": 4,
    "order_id": 5,
    "dish_id": 4471,
    "dish_name": "Fricassê de Carne Bovina(Patinho)",
    "size_name": "Padrão",
    "quantity": 1,
    "base_price": "25.76",
    "final_price": "25.76",
    "accompaniments_snapshot": "{\"Acompanhamento 120g\":\"Arroz Integral\",\"Acompanhamento 100g\":\"Feijão\",\"_ywpar_total_points\":\"25\"}",
    "size_id": null,
    "options_json": null,
    "comment": null
  },
  {
    "id": 5,
    "order_id": 5,
    "dish_id": 4440,
    "dish_name": "Estrogonofe de Frango",
    "size_name": "Padrão",
    "quantity": 1,
    "base_price": "25.37",
    "final_price": "25.37",
    "accompaniments_snapshot": "{\"Acompanhamento 120g\":\"Arroz Integral\",\"Acompanhamento 100g\":\"Mandioquinha Cozida\",\"_ywpar_total_points\":\"25\"}",
    "size_id": null,
    "options_json": null,
    "comment": null
  },
  {
    "id": 6,
    "order_id": 5,
    "dish_id": 25540,
    "dish_name": "Peito de Frango ao Molho Madeira",
    "size_name": "Padrão",
    "quantity": 1,
    "base_price": "23.57",
    "final_price": "23.57",
    "accompaniments_snapshot": "{\"Acompanhamento 120g\":\"Arroz Branco\",\"Acompanhamento 100g\":\"Abobirnha Refogada\",\"_ywpar_total_points\":\"23\"}",
    "size_id": null,
    "options_json": null,
    "comment": null
  },
  {
    "id": 7,
    "order_id": 5,
    "dish_id": 4454,
    "dish_name": "Abobrinha Recheada com Frango",
    "size_name": "Padrão",
    "quantity": 1,
    "base_price": "22.37",
    "final_price": "22.37",
    "accompaniments_snapshot": "{\"Acompanhamento 120g\":\"Arroz Branco\",\"Acompanhamento 100g\":\"Abobirnha Refogada\",\"_ywpar_total_points\":\"22\"}",
    "size_id": null,
    "options_json": null,
    "comment": null
  },
  {
    "id": 8,
    "order_id": 6,
    "dish_id": 13991,
    "dish_name": "Pacote Semanal",
    "size_name": "Padrão",
    "quantity": 2,
    "base_price": "164.36",
    "final_price": "328.72",
    "accompaniments_snapshot": "{\"Opção 1 (300g)\":\"Escondidinho de Batata Doce(Frango)\",\"Opção 1 (300g) - Acomp. 1\":\"Arroz Integral\",\"Opção 1 (300g) - Acomp. 2\":\"Mix de Legumes\",\"Opção 2 (300g)\":\"Peito de Frango Desfiado\",\"Opção 2 (300g) - Acomp. 1\":\"Mix de Legumes\",\"Opção 2 (300g) - Acomp. 2\":\"Arroz Integral\",\"Opção 3 (300g)\":\"Patinho desfiado\",\"Opção 3 (300g) - Acomp. 1\":\"Batata Doce Purê\",\"Opção 3 (300g) - Acomp. 2\":\"Mix de Legumes\",\"Opção 4 (300g)\":\"Estrogonofe Suíno\",\"Opção 4 (300g) - Acomp. 1\":\"Mix de Legumes\",\"Opção 4 (300g) - Acomp. 2\":\"Arroz Integral\",\"Opção 5 (300g)\":\"Carne Louca\",\"Opção 5 (300g) - Acomp. 1\":\"Arroz Integral\",\"Opção 5 (300g) - Acomp. 2\":\"Brócolis\",\"Opção 6 (300g)\":\"Peito de Frango ao Molho Madeira\",\"Opção 6 (300g) - Acomp. 1\":\"Batata Doce Purê\",\"Opção 6 (300g) - Acomp. 2\":\"Mix de Legumes\",\"Opção 7 (300g)\":\"Frango Louco\",\"Opção 7 (300g) - Acomp. 1\":\"Arroz Integral\",\"Opção 7 (300g) - Acomp. 2\":\"Mix de Legumes\",\"Opção 8 (300g)\":\"Fricassê de Carne Bovina(Patinho)\",\"Opção 8 (300g) - Acomp. 1\":\"Arroz Integral\",\"Opção 8 (300g) - Acomp. 2\":\"Brocolis\",\"Opção 9 (300g)\":\"Peito de Frango Desfiado\",\"Opção 9 (300g) - Acomp. 1\":\"Arroz Integral\",\"Opção 9 (300g) - Acomp. 2\":\"Mix de Legumes\",\"Opção 10 (300g)\":\"Escondidinho de Mandioquinha(Frango)\",\"Opção 10 (300g) - Acomp. 1\":\"Arroz Integral\",\"Opção 10 (300g) - Acomp. 2\":\"Mix de Legumes\",\"_ywpar_total_points\":\"327\"}",
    "size_id": null,
    "options_json": null,
    "comment": null
  },
  {
    "id": 9,
    "order_id": 7,
    "dish_id": 25338,
    "dish_name": "Pacote 300 e 200g",
    "size_name": "200g",
    "quantity": 1,
    "base_price": "151.61",
    "final_price": "151.61",
    "accompaniments_snapshot": "{\"Opçao 1(300g)\":\"Escondidinho de Mandioquinha(Patinho)\",\"Opçao 1(300g) - Acomp. 1\":\"Arroz Integral\",\"Opçao 1(300g) - Acomp. 2\":\"Mix de Legumes\",\"Opçao 2(300g)\":\"Patinho desfiado\",\"Opçao 2(300g) - Acomp. 1\":\"Arroz Integral\",\"Opçao 2(300g) - Acomp. 2\":\"Abobrinha Refogada\",\"Opçao 3(300g)\":\"Escondidinho de Mandioquinha(Patinho)\",\"Opçao 3(300g) - Acomp. 1\":\"Arroz Integral\",\"Opçao 3(300g) - Acomp. 2\":\"Mix de Legumes\",\"Opçao 4(300g)\":\"Carne Louca\",\"Opçao 4(300g) - Acomp. 1\":\"Arroz Integral\",\"Opçao 4(300g) - Acomp. 2\":\"Mix de Legumes\",\"Opçao 5(300g)\":\"Escondidinho de Batata Doce(Frango)\",\"Opçao 5(300g) - Acomp. 1\":\"Arroz Integral\",\"Opçao 5(300g) - Acomp. 2\":\"Mix de Legumes\",\"Opçao 6(200g)\":\"Estrogonofe de Frango\",\"Opçao 6(200g) - Acomp. 1\":\"Batata Doce Purê\",\"Opçao 7(200g)\":\"Sobrecoxa ao molho de espinafre\",\"Opçao 7(200g) - Acomp. 1\":\"Arroz Integral\",\"Opçao 8(200g)\":\"Escondidinho de Mandioquinha(Patinho)\",\"Opçao 8(200g) - Acomp. 1\":\"Mix de Legumes\",\"Opçao 9(200g)\":\"Escondidinho de Mandioquinha(Frango)\",\"Opçao 9(200g) - Acomp. 1\":\"Arroz Integral\",\"Opçao 10(200g)\":\"Peito de Frango Grelhado\",\"Opçao 10(200g) - Acomp. 1\":\"Arroz Integral\",\"_ywpar_total_points\":\"151\"}",
    "size_id": null,
    "options_json": null,
    "comment": null
  },
  {
    "id": 10,
    "order_id": 8,
    "dish_id": 5886,
    "dish_name": "Escondidinho de Mandioquinha(Patinho)",
    "size_name": "Padrão",
    "quantity": 2,
    "base_price": "21.27",
    "final_price": "42.54",
    "accompaniments_snapshot": "{\"Acompanhamento 120g\":\"Arroz Branco\",\"Acompanhamento 100g\":\"Mix de Legumes\",\"_ywpar_total_points\":\"41\"}",
    "size_id": null,
    "options_json": null,
    "comment": null
  }
]
```

---

## 📦 Tabela: `orders`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | bigint unsigned | ❌ | 🔑 PK | NULL | auto_increment |
| **user_id** | int | ❌ |  | NULL |  |
| **status** | enum('pending','processing','shipped','delivered','cancelled') | ❌ |  | `pending` |  |
| **subtotal** | decimal(10,2) | ❌ |  | NULL |  |
| **coupon_code** | varchar(50) | ✅ |  | NULL |  |
| **discount** | decimal(10,2) | ❌ |  | `0.00` |  |
| **shipping_cost** | decimal(10,2) | ❌ |  | `0.00` |  |
| **total** | decimal(10,2) | ❌ |  | NULL |  |
| **payment_method** | varchar(50) | ❌ |  | NULL |  |
| **shipping_address** | varchar(255) | ✅ |  | NULL |  |
| **shipping_city** | varchar(100) | ✅ |  | NULL |  |
| **shipping_state** | varchar(2) | ✅ |  | NULL |  |
| **shipping_zip_code** | varchar(20) | ✅ |  | NULL |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |
| **updated_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| **payment_status** | enum('pending','paid','failed','refunded') | ❌ |  | `pending` |  |
| **shipping_address_number** | varchar(20) | ✅ |  | NULL |  |
| **shipping_address_complement** | varchar(100) | ✅ |  | NULL |  |
| **shipping_neighborhood** | varchar(100) | ✅ |  | NULL |  |
| **customer_document** | blob | ✅ |  | NULL |  |
| **woo_order_id** | int | ✅ |  | NULL |  |
| **woo_order_number** | varchar(100) | ✅ |  | NULL |  |
| **loyalty_points_used** | int | ❌ |  | `0` |  |
| **loyalty_points_earned** | int | ❌ |  | `0` |  |
| **discount_amount** | decimal(10,2) | ❌ |  | `0.00` |  |
| **discount_description** | varchar(255) | ✅ |  | NULL |  |
| **notes** | text | ✅ |  | NULL |  |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "user_id": 432,
    "status": "processing",
    "subtotal": "151.61",
    "coupon_code": null,
    "discount": "0.00",
    "shipping_cost": "0.00",
    "total": "151.61",
    "payment_method": "woo_payment_on_delivery",
    "shipping_address": "Avenida Nove de Julho, Loja 03 OMO LAVANDERIA",
    "shipping_city": "Jundiaí",
    "shipping_state": "SP",
    "shipping_zip_code": "13201-019",
    "created_at": "2025-12-09T12:50:35.000Z",
    "updated_at": "2025-12-09T15:50:37.000Z",
    "payment_status": "paid",
    "shipping_address_number": "s/n",
    "shipping_address_complement": null,
    "shipping_neighborhood": null,
    "customer_document": null,
    "woo_order_id": null,
    "woo_order_number": null,
    "loyalty_points_used": 0,
    "loyalty_points_earned": 0,
    "discount_amount": "0.00",
    "discount_description": null,
    "notes": null
  },
  {
    "id": 2,
    "user_id": 432,
    "status": "processing",
    "subtotal": "151.61",
    "coupon_code": null,
    "discount": "0.00",
    "shipping_cost": "0.00",
    "total": "151.61",
    "payment_method": "woo_payment_on_delivery",
    "shipping_address": "Avenida Nove de Julho, Loja 03 OMO LAVANDERIA",
    "shipping_city": "Jundiaí",
    "shipping_state": "SP",
    "shipping_zip_code": "13201-019",
    "created_at": "2025-12-09T12:50:35.000Z",
    "updated_at": "2025-12-09T15:50:37.000Z",
    "payment_status": "paid",
    "shipping_address_number": "s/n",
    "shipping_address_complement": null,
    "shipping_neighborhood": null,
    "customer_document": null,
    "woo_order_id": null,
    "woo_order_number": null,
    "loyalty_points_used": 0,
    "loyalty_points_earned": 0,
    "discount_amount": "0.00",
    "discount_description": null,
    "notes": null
  },
  {
    "id": 3,
    "user_id": 432,
    "status": "processing",
    "subtotal": "151.61",
    "coupon_code": null,
    "discount": "0.00",
    "shipping_cost": "0.00",
    "total": "151.61",
    "payment_method": "woo_payment_on_delivery",
    "shipping_address": "Avenida Nove de Julho, Loja 03 OMO LAVANDERIA",
    "shipping_city": "Jundiaí",
    "shipping_state": "SP",
    "shipping_zip_code": "13201-019",
    "created_at": "2025-12-09T12:50:35.000Z",
    "updated_at": "2025-12-09T15:50:37.000Z",
    "payment_status": "paid",
    "shipping_address_number": "s/n",
    "shipping_address_complement": null,
    "shipping_neighborhood": null,
    "customer_document": null,
    "woo_order_id": null,
    "woo_order_number": null,
    "loyalty_points_used": 0,
    "loyalty_points_earned": 0,
    "discount_amount": "0.00",
    "discount_description": null,
    "notes": null
  },
  {
    "id": 4,
    "user_id": 557,
    "status": "processing",
    "subtotal": "167.63",
    "coupon_code": null,
    "discount": "0.00",
    "shipping_cost": "0.00",
    "total": "167.63",
    "payment_method": "woo_payment_on_delivery",
    "shipping_address": "Rua Elias Juvenal de Mello, apt. 113A",
    "shipping_city": "Jundiaí",
    "shipping_state": "SP",
    "shipping_zip_code": "13208-820",
    "created_at": "2025-12-08T14:49:47.000Z",
    "updated_at": "2025-12-08T17:49:48.000Z",
    "payment_status": "paid",
    "shipping_address_number": "s/n",
    "shipping_address_complement": null,
    "shipping_neighborhood": null,
    "customer_document": null,
    "woo_order_id": null,
    "woo_order_number": null,
    "loyalty_points_used": 0,
    "loyalty_points_earned": 0,
    "discount_amount": "0.00",
    "discount_description": null,
    "notes": null
  },
  {
    "id": 5,
    "user_id": 591,
    "status": "delivered",
    "subtotal": "122.83",
    "coupon_code": null,
    "discount": "0.00",
    "shipping_cost": "0.00",
    "total": "122.83",
    "payment_method": "woo_payment_on_delivery",
    "shipping_address": "Rua Aruá, Casa 02",
    "shipping_city": "Várzea Paulista",
    "shipping_state": "SP",
    "shipping_zip_code": "13225-572",
    "created_at": "2025-12-03T09:18:49.000Z",
    "updated_at": "2025-12-03T12:18:51.000Z",
    "payment_status": "paid",
    "shipping_address_number": "s/n",
    "shipping_address_complement": null,
    "shipping_neighborhood": null,
    "customer_document": null,
    "woo_order_id": null,
    "woo_order_number": null,
    "loyalty_points_used": 0,
    "loyalty_points_earned": 0,
    "discount_amount": "0.00",
    "discount_description": null,
    "notes": null
  },
  {
    "id": 6,
    "user_id": 155,
    "status": "delivered",
    "subtotal": "335.26",
    "coupon_code": null,
    "discount": "0.00",
    "shipping_cost": "0.00",
    "total": "328.72",
    "payment_method": "woo_payment_on_delivery",
    "shipping_address": "Rua José Fontebasso",
    "shipping_city": "Jundiaí",
    "shipping_state": "SP",
    "shipping_zip_code": "13218-682",
    "created_at": "2025-12-02T19:58:28.000Z",
    "updated_at": "2025-12-02T22:58:30.000Z",
    "payment_status": "paid",
    "shipping_address_number": "s/n",
    "shipping_address_complement": null,
    "shipping_neighborhood": null,
    "customer_document": null,
    "woo_order_id": null,
    "woo_order_number": null,
    "loyalty_points_used": 0,
    "loyalty_points_earned": 0,
    "discount_amount": "0.00",
    "discount_description": null,
    "notes": null
  },
  {
    "id": 7,
    "user_id": 588,
    "status": "delivered",
    "subtotal": "151.61",
    "coupon_code": null,
    "discount": "0.00",
    "shipping_cost": "0.00",
    "total": "144.03",
    "payment_method": "woo_payment_on_delivery",
    "shipping_address": "Avenida Yolanda Ferreira Breda, Bar e Mercearia MR Rossi",
    "shipping_city": "Jundiaí",
    "shipping_state": "SP",
    "shipping_zip_code": "13218-300",
    "created_at": "2025-12-01T13:53:26.000Z",
    "updated_at": "2025-12-01T16:53:28.000Z",
    "payment_status": "paid",
    "shipping_address_number": "s/n",
    "shipping_address_complement": null,
    "shipping_neighborhood": null,
    "customer_document": null,
    "woo_order_id": null,
    "woo_order_number": null,
    "loyalty_points_used": 0,
    "loyalty_points_earned": 0,
    "discount_amount": "0.00",
    "discount_description": null,
    "notes": null
  },
  {
    "id": 8,
    "user_id": 313,
    "status": "processing",
    "subtotal": "508.48",
    "coupon_code": null,
    "discount": "0.00",
    "shipping_cost": "0.00",
    "total": "418.86",
    "payment_method": "woo_payment_on_delivery",
    "shipping_address": "Rua Ângelo Corradini, Torre 05 Apto 117",
    "shipping_city": "Jundiaí",
    "shipping_state": "SP",
    "shipping_zip_code": "13219-071",
    "created_at": "2025-12-01T11:17:46.000Z",
    "updated_at": "2025-12-01T14:17:48.000Z",
    "payment_status": "paid",
    "shipping_address_number": "s/n",
    "shipping_address_complement": null,
    "shipping_neighborhood": null,
    "customer_document": null,
    "woo_order_id": null,
    "woo_order_number": null,
    "loyalty_points_used": 0,
    "loyalty_points_earned": 0,
    "discount_amount": "0.00",
    "discount_description": null,
    "notes": null
  },
  {
    "id": 9,
    "user_id": 563,
    "status": "delivered",
    "subtotal": "167.63",
    "coupon_code": null,
    "discount": "0.00",
    "shipping_cost": "0.00",
    "total": "167.63",
    "payment_method": "woo_payment_on_delivery",
    "shipping_address": "Rua Doutor Antenor Soares Gandra",
    "shipping_city": "Jundiaí",
    "shipping_state": "SP",
    "shipping_zip_code": "13218-111",
    "created_at": "2025-11-29T18:36:30.000Z",
    "updated_at": "2025-11-29T21:36:31.000Z",
    "payment_status": "paid",
    "shipping_address_number": "s/n",
    "shipping_address_complement": null,
    "shipping_neighborhood": null,
    "customer_document": null,
    "woo_order_id": null,
    "woo_order_number": null,
    "loyalty_points_used": 0,
    "loyalty_points_earned": 0,
    "discount_amount": "0.00",
    "discount_description": null,
    "notes": null
  },
  {
    "id": 10,
    "user_id": 593,
    "status": "delivered",
    "subtotal": "265.98",
    "coupon_code": null,
    "discount": "0.00",
    "shipping_cost": "0.00",
    "total": "219.48",
    "payment_method": "woo_payment_on_delivery",
    "shipping_address": "Rua Primeiro de Maio, Ap1403",
    "shipping_city": "Varzea paulista",
    "shipping_state": "SP",
    "shipping_zip_code": "13225-750",
    "created_at": "2025-11-26T23:50:38.000Z",
    "updated_at": "2025-11-27T02:50:40.000Z",
    "payment_status": "paid",
    "shipping_address_number": "s/n",
    "shipping_address_complement": null,
    "shipping_neighborhood": null,
    "customer_document": null,
    "woo_order_id": null,
    "woo_order_number": null,
    "loyalty_points_used": 0,
    "loyalty_points_earned": 0,
    "discount_amount": "0.00",
    "discount_description": null,
    "notes": null
  }
]
```

---

## 📦 Tabela: `package_option_dishes`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **package_option_id** | int | ❌ | 🔗 FK | NULL |  |
| **dish_id** | int | ❌ | 🔗 FK | NULL |  |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 7,
    "package_option_id": 2,
    "dish_id": 3
  },
  {
    "id": 8,
    "package_option_id": 2,
    "dish_id": 6
  },
  {
    "id": 13,
    "package_option_id": 1,
    "dish_id": 11
  },
  {
    "id": 14,
    "package_option_id": 1,
    "dish_id": 12
  }
]
```

---

## 📦 Tabela: `package_option_groups`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **package_option_id** | int | ❌ | 🔗 FK | NULL |  |
| **accompaniment_group_id** | int | ❌ |  | NULL |  |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "package_option_id": 2,
    "accompaniment_group_id": 6
  },
  {
    "id": 2,
    "package_option_id": 2,
    "accompaniment_group_id": 4
  },
  {
    "id": 6,
    "package_option_id": 1,
    "accompaniment_group_id": 4
  },
  {
    "id": 7,
    "package_option_id": 1,
    "accompaniment_group_id": 6
  }
]
```

---

## 📦 Tabela: `package_options`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **package_id** | int | ❌ |  | NULL |  |
| **name** | varchar(255) | ❌ |  | NULL |  |
| **option_order** | int | ✅ |  | `0` |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "package_id": 1,
    "name": "Opção 300g",
    "option_order": 1,
    "created_at": "2025-12-05T21:39:53.000Z"
  },
  {
    "id": 2,
    "package_id": 1,
    "name": "Opçao 2 300g",
    "option_order": 2,
    "created_at": "2025-12-05T21:40:27.000Z"
  }
]
```

---

## 📦 Tabela: `packages`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **name** | varchar(255) | ❌ |  | NULL |  |
| **slug** | varchar(255) | ❌ | 🦄 UQ | NULL |  |
| **description** | text | ✅ |  | NULL |  |
| **image_url** | varchar(500) | ✅ |  | NULL |  |
| **base_price** | decimal(10,2) | ❌ |  | NULL |  |
| **is_active** | tinyint(1) | ✅ |  | `1` |  |
| **display_order** | int | ✅ |  | `0` |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |
| **updated_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| **number_of_options** | int | ✅ |  | `0` |  |
| **month** | varchar(50) | ✅ |  | NULL |  |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "name": "Pacote Dia a Dia",
    "slug": "dia-a-dia",
    "description": "teste",
    "image_url": "",
    "base_price": "167.67",
    "is_active": 1,
    "display_order": 0,
    "created_at": "2025-12-06T00:39:40.000Z",
    "updated_at": "2025-12-06T00:53:50.000Z",
    "number_of_options": 5,
    "month": "2025-12"
  }
]
```

---

## 📦 Tabela: `payment_methods`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **name** | varchar(100) | ❌ | 🦄 UQ | NULL |  |
| **description** | text | ✅ |  | NULL |  |
| **icon** | varchar(100) | ✅ |  | NULL |  |
| **is_active** | tinyint(1) | ✅ |  | `1` |  |
| **display_order** | int | ✅ |  | `0` |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |
| **updated_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| **brand_name** | varchar(100) | ✅ |  | NULL |  |
| **brand_logo_url** | varchar(255) | ✅ |  | NULL |  |
| **discount_percentage** | decimal(5,2) | ✅ |  | `0.00` |  |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "name": "Pix",
    "description": "Paamento por Pix",
    "icon": null,
    "is_active": 1,
    "display_order": 0,
    "created_at": "2025-12-05T14:03:42.000Z",
    "updated_at": "2025-12-05T14:03:42.000Z",
    "brand_name": null,
    "brand_logo_url": null,
    "discount_percentage": "0.00"
  },
  {
    "id": 2,
    "name": "Crédito",
    "description": "Pagamento Cartão de Crédito",
    "icon": null,
    "is_active": 1,
    "display_order": 0,
    "created_at": "2025-12-05T14:04:05.000Z",
    "updated_at": "2025-12-05T14:04:25.000Z",
    "brand_name": "",
    "brand_logo_url": "",
    "discount_percentage": "0.00"
  }
]
```

---

## 📦 Tabela: `quantity_discount_rules`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **name** | varchar(255) | ❌ |  | NULL |  |
| **description** | text | ✅ |  | NULL |  |
| **min_quantity** | int | ❌ |  | NULL |  |
| **max_quantity** | int | ✅ |  | NULL |  |
| **discount_type** | enum('percentage','fixed') | ✅ |  | `percentage` |  |
| **discount_value** | decimal(10,2) | ❌ |  | NULL |  |
| **priority** | int | ✅ |  | `0` |  |
| **is_active** | tinyint(1) | ✅ |  | `1` |  |
| **created_at** | timestamp | ✅ |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |
| **updated_at** | timestamp | ✅ |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Amostra de Dados (Primeiras 10 linhas)

_(Tabela está vazia)_

---

## 📦 Tabela: `shipping_zones`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **name** | varchar(255) | ❌ |  | NULL |  |
| **description** | text | ✅ |  | NULL |  |
| **zip_code_start** | varchar(20) | ❌ |  | NULL |  |
| **zip_code_end** | varchar(20) | ❌ |  | NULL |  |
| **shipping_cost** | decimal(10,2) | ❌ |  | NULL |  |
| **estimated_days** | int | ✅ |  | NULL |  |
| **is_active** | tinyint(1) | ✅ |  | `1` |  |
| **created_at** | timestamp | ✅ |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED |
| **updated_at** | timestamp | ✅ |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Amostra de Dados (Primeiras 10 linhas)

_(Tabela está vazia)_

---

## 📦 Tabela: `size_accompaniment_groups`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | int | ❌ | 🔑 PK | NULL | auto_increment |
| **size_id** | int | ❌ |  | NULL |  |
| **accompaniment_group_id** | int | ❌ |  | NULL |  |
| **is_required** | tinyint(1) | ✅ |  | `0` |  |
| **allow_multiple** | tinyint(1) | ✅ |  | `0` |  |
| **display_order** | int | ✅ |  | `0` |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 8,
    "size_id": 1,
    "accompaniment_group_id": 4,
    "is_required": 0,
    "allow_multiple": 0,
    "display_order": 0,
    "created_at": "2025-12-02T23:49:38.000Z"
  },
  {
    "id": 9,
    "size_id": 1,
    "accompaniment_group_id": 6,
    "is_required": 0,
    "allow_multiple": 0,
    "display_order": 0,
    "created_at": "2025-12-05T03:35:56.000Z"
  }
]
```

---

## 📦 Tabela: `store_settings`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | bigint unsigned | ❌ | 🔑 PK | NULL | auto_increment |
| **general_min_order_amount** | decimal(10,2) | ✅ |  | `0.00` |  |
| **min_order_message** | text | ✅ |  | NULL |  |
| **updated_at** | timestamp | ✅ |  | `CURRENT_TIMESTAMP` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "general_min_order_amount": "0.00",
    "min_order_message": null,
    "updated_at": "2025-12-06T16:59:41.000Z"
  }
]
```

---

## 📦 Tabela: `user_profiles`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | bigint unsigned | ❌ | 🔑 PK | NULL | auto_increment |
| **user_id** | int | ❌ | 🦄 UQ | NULL |  |
| **phone** | varchar(50) | ✅ |  | NULL |  |
| **address** | text | ✅ |  | NULL |  |
| **city** | varchar(200) | ✅ |  | NULL |  |
| **state** | varchar(50) | ✅ |  | NULL |  |
| **zip_code** | varchar(50) | ✅ |  | NULL |  |
| **loyalty_points** | int | ✅ |  | `0` |  |
| **total_spent** | decimal(15,2) | ✅ |  | `0.00` |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |
| **updated_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| **customer_document** | text | ✅ |  | NULL |  |
| **cpf** | varchar(20) | ✅ |  | NULL |  |
| **birth_date** | date | ✅ |  | NULL |  |
| **gender** | varchar(10) | ✅ |  | NULL |  |
| **instagram** | varchar(255) | ✅ |  | NULL |  |
| **notes** | text | ✅ |  | NULL |  |

### Amostra de Dados (Primeiras 10 linhas)

_(Tabela está vazia)_

---

## 📦 Tabela: `users`

### Estrutura (Colunas)

| Campo | Tipo | Nulo | Chave | Padrão | Extra |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **id** | bigint unsigned | ❌ | 🔑 PK | NULL | auto_increment |
| **email** | varchar(255) | ❌ | 🦄 UQ | NULL |  |
| **name** | varchar(255) | ✅ |  | NULL |  |
| **role** | enum('admin','user') | ✅ |  | `user` |  |
| **password** | varchar(255) | ✅ |  | NULL |  |
| **customer_document** | varchar(255) | ✅ |  | NULL |  |
| **open_id** | varchar(255) | ❌ | 🦄 UQ | NULL |  |
| **login_method** | varchar(50) | ✅ |  | NULL |  |
| **last_signed_in** | timestamp | ✅ |  | NULL |  |
| **created_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED |
| **updated_at** | timestamp | ✅ |  | `now()` | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

### Amostra de Dados (Primeiras 10 linhas)

```json
[
  {
    "id": 1,
    "email": "contato@gourmetsaudavel.com",
    "name": "Everton Coimbra",
    "role": "admin",
    "password": "5a8b5a36d06ff0b514e6e47d762904e08006bf4b91719c303d7444a1ff6bd27c:326c99b7598e2dd5d18cc6bf318384b0fa3123bc6cb58f28d79257128748623db5c54097548f6453bc2e9e9436f83603fe1c2c4db5d4776805a41622ddb94e21",
    "customer_document": "764b51e8bdab0bb63655a9043197008c:f306706bfffbe458d1476613155de6ee:2fd419cb14a499a2dced5c",
    "open_id": "woo_import_1",
    "login_method": null,
    "last_signed_in": "2025-12-10T03:11:35.000Z",
    "created_at": "2019-12-03T04:51:48.000Z",
    "updated_at": "2025-12-10T00:11:34.000Z"
  },
  {
    "id": 2,
    "email": "gourmetsaudaveladm@gmail.com",
    "name": "visitante",
    "role": "user",
    "password": null,
    "customer_document": null,
    "open_id": "woo_import_2",
    "login_method": null,
    "last_signed_in": null,
    "created_at": "2019-12-09T17:40:49.000Z",
    "updated_at": "2025-12-03T00:03:51.000Z"
  },
  {
    "id": 3,
    "email": "gabriel0306@hotmail.com",
    "name": "Gabriel Morales Gonelli",
    "role": "user",
    "password": null,
    "customer_document": "d31073c6b5cb66a05b1d814b0ce9d662:62f0ae9b5931869fc7bcea1ce6f51e5a:696dab884475524d4f0fe4",
    "open_id": "woo_import_3",
    "login_method": null,
    "last_signed_in": null,
    "created_at": "2020-03-23T20:08:18.000Z",
    "updated_at": "2025-12-09T17:45:46.000Z"
  },
  {
    "id": 4,
    "email": "raquel.doratioto@gmail.com",
    "name": "Raquel De Sousa Borges",
    "role": "user",
    "password": null,
    "customer_document": "56ae675d6b4edad2a48098c788215713:bb1f21ac191cbc48babc490628c67a0d:638a67c19f728b12552821",
    "open_id": "woo_import_5",
    "login_method": null,
    "last_signed_in": null,
    "created_at": "2020-04-03T05:51:27.000Z",
    "updated_at": "2025-12-09T17:45:46.000Z"
  },
  {
    "id": 5,
    "email": "kpompeu@gmail.com",
    "name": "Karina Pompeu",
    "role": "user",
    "password": null,
    "customer_document": "90c2a503711ca25fcf465c9626ccd381:eb147a3b164ff5b0fc50d03759c8ab83:8d3f1cad6136275f160d6d",
    "open_id": "woo_import_6",
    "login_method": null,
    "last_signed_in": null,
    "created_at": "2020-04-08T19:28:52.000Z",
    "updated_at": "2025-12-09T17:45:46.000Z"
  },
  {
    "id": 6,
    "email": "THAISGRAZIELEOLIVEIRA@HOTMAIL.COM",
    "name": "THAIS GRAZIELE DE OLIVEIRA",
    "role": "user",
    "password": null,
    "customer_document": "7c0f03f05f4262bbdba2ea54cc6f9c3f:b092e243a66d8872372a243abb02b0d4:3d97ed30bb6c22302d427d",
    "open_id": "woo_import_7",
    "login_method": null,
    "last_signed_in": null,
    "created_at": "2020-04-08T22:26:37.000Z",
    "updated_at": "2025-12-09T17:45:46.000Z"
  },
  {
    "id": 7,
    "email": "mandinha_work@hotmail.com",
    "name": "AmandaCaroline",
    "role": "user",
    "password": null,
    "customer_document": "d2d41229fca7c26c710b68c19000433a:fb026c7ce136ddbf3827c79fc0644bdb:8d96d2d0216e38f8ef0d7e",
    "open_id": "woo_import_8",
    "login_method": null,
    "last_signed_in": null,
    "created_at": "2020-04-09T16:49:50.000Z",
    "updated_at": "2025-12-09T17:45:46.000Z"
  },
  {
    "id": 8,
    "email": "sadao.filho@gmail.com",
    "name": "Alberto",
    "role": "user",
    "password": null,
    "customer_document": null,
    "open_id": "woo_import_10",
    "login_method": null,
    "last_signed_in": null,
    "created_at": "2020-04-17T18:49:34.000Z",
    "updated_at": "2025-11-26T04:26:06.000Z"
  },
  {
    "id": 9,
    "email": "ro_gatera@yahoo.com.br",
    "name": "Roberta Borges",
    "role": "user",
    "password": null,
    "customer_document": "f1b270293af4e4193066d981bebb02e9:45faa7d2ded2ff46d24b155ee92b76a7:176bc895fcc46f2ec23e9f",
    "open_id": "woo_import_11",
    "login_method": null,
    "last_signed_in": null,
    "created_at": "2020-04-24T17:32:07.000Z",
    "updated_at": "2025-12-09T17:45:46.000Z"
  },
  {
    "id": 10,
    "email": "prigadelha_ep@hotmail.com",
    "name": "Priscilla Gadelha",
    "role": "user",
    "password": null,
    "customer_document": "7510e25739c760dbb44a55686200b343:d40f2ed1faee6ac8958fcdfbdd80bdd1:7e262a8946e3ca54c0c9f6",
    "open_id": "woo_import_12",
    "login_method": null,
    "last_signed_in": null,
    "created_at": "2020-04-28T19:04:25.000Z",
    "updated_at": "2025-12-09T17:45:46.000Z"
  }
]
```

---

