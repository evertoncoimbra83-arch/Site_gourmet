// client/src/pages/AdminAppearance.tsx
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/_core/trpc';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils"; // Assumindo que você tem um utilitário de classes

// =================================================================
// UTILS DE CONVERSÃO DE COR (Mantidos)
// =================================================================

/**
 * Converte uma cor HSL string do Tailwind (ex: "210 40% 98%") para HEX (ex: "#f6f7f9").
 */
const hslToHex = (hslString: string): string => {
    try {
        if (!hslString) return '#000000';
        
        const parts = hslString.split(' ').map(p => parseFloat(p.replace('%', '')));
        if (parts.length < 3 || parts.some(isNaN)) return '#000000';

        let h = parts[0];
        let s = parts[1] / 100;
        let l = parts[2] / 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l; 
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h / 360 + 1 / 3);
            g = hue2rgb(p, q, h / 360);
            b = hue2rgb(p, q, h / 360 - 1 / 3);
        }

        const toHex = (c: number) => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
        return '#000000'; 
    }
};

/**
 * Converte uma cor HEX (ex: "#ff0000") para HSL string (ex: "0 100% 50%").
 */
const hexToHsl = (hex: string): string => {
    if (!hex || hex.length !== 7 || hex[0] !== '#') return '0 0% 0%';

    let r = parseInt(hex.substring(1, 3), 16) / 255;
    let g = parseInt(hex.substring(3, 5), 16) / 255;
    let b = parseInt(hex.substring(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number = 0, s: number, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    const H = Math.round(h * 360);
    const S = Math.round(s * 100);
    const L = Math.round(l * 100);
    
    return `${H} ${S}% ${L}%`;
};

// =================================================================
// INTERFACE E DEFAULTS (REVISADO)
// =================================================================

interface ThemeState {
    borderRadius: string;
    primaryColor: string;
    primaryForeground: string;
    secondaryColor: string;
    secondaryForeground: string;
    backgroundColor: string;
    foregroundColor: string;
    borderColor: string;
    ringColor: string;
    cardColor: string;
    cardForeground: string;
    inputColor: string;
    darkPrimaryColor: string;
    darkBackgroundColor: string;
    // ✅ NOVAS PROPRIEDADES DE LAYOUT
    headerBgColor: string;
    footerBgColor: string;
    footerTextColor: string;
}

const defaultTheme: ThemeState = {
    // ... valores padrão existentes
    borderRadius: '0.5rem',
    primaryColor: '160 8% 35%',
    primaryForeground: '0 0% 100%',
    secondaryColor: '48 96% 62%',
    secondaryForeground: '160 2% 22%',
    backgroundColor: '0 0% 100%',
    foregroundColor: '222 47.4% 11.2%',
    borderColor: '240 5.9% 90%',
    ringColor: '160 8% 35%',
    cardColor: '0 0% 100%',
    cardForeground: '222 47.4% 11.2%',
    inputColor: '240 5.9% 90%',
    darkPrimaryColor: '160 8% 35%',
    darkBackgroundColor: '224 71.4% 4.1%',
    // ✅ DEFAULTS PARA NOVAS CORES DE LAYOUT
    headerBgColor: '0 0% 100%', // Padrão Card/Branco
    footerBgColor: '160 8% 35%', // Padrão Primary
    footerTextColor: '0 0% 100%', // Padrão Primary Foreground
};

// =================================================================
// COMPONENTE: CAMPO DE TEMA APRIMORADO (Mantido)
// =================================================================

const ColorThemeField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    helperText?: string;
}> = ({ label, value, onChange, helperText }) => {
    
    const [hexValue, setHexValue] = useState(() => hslToHex(value));
    
    useEffect(() => {
        setHexValue(hslToHex(value));
    }, [value]);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        setHexValue(newHex); 
        const newHsl = hexToHsl(newHex);
        onChange(newHsl);
    };
    
    const handleHslChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHsl = e.target.value;
        onChange(newHsl);
        setHexValue(hslToHex(newHsl));
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={label}>{label}</Label>
            <div className="flex items-center space-x-2">
                
                <Input
                    id={`${label}-color`}
                    type="color"
                    value={hexValue}
                    onChange={handleHexChange}
                    className="w-10 h-10 p-0 border-none cursor-pointer"
                    style={{ background: 'transparent' }} 
                    title={`Selecionar Cor (${hexValue})`}
                />

                <div className="flex-1">
                    <Input
                        id={label}
                        value={value}
                        onChange={handleHslChange}
                        type="text"
                        placeholder="H S% L% (Ex: 160 8% 35%)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Valor HSL (Editável)</p>
                </div>
            </div>
            {helperText && <p className="text-sm text-muted-foreground mt-1">{helperText}</p>}
        </div>
    );
};

// =================================================================
// PÁGINA: ADMIN APPEARANCE (REVISADO)
// =================================================================

type TRPCThemeOutput = any;

export default function AdminAppearance() {
    const { toast } = useToast();
    const [theme, setTheme] = useState<ThemeState>(defaultTheme);
    const [isSaving, setIsSaving] = useState(false);
    
    const { data: currentTheme, isLoading, refetch } = trpc.theme.get.useQuery();

    const saveThemeMutation = trpc.theme.update.useMutation({
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "O tema foi salvo e aplicado com sucesso." });
            refetch(); 
        },
        onError: (error) => {
            toast({
                title: "Erro ao salvar",
                description: `Não foi possível salvar o tema: ${error.message}`,
                variant: "destructive",
            });
        },
        onSettled: () => {
            setIsSaving(false);
        }
    });

    const mapThemeData = useCallback((data: Partial<TRPCThemeOutput> | undefined): ThemeState => {
        if (!data) return defaultTheme;

        return {
            borderRadius: data.borderRadius ?? defaultTheme.borderRadius,
            primaryColor: data.primaryColor ?? defaultTheme.primaryColor,
            primaryForeground: data.primaryForeground ?? defaultTheme.primaryForeground,
            secondaryColor: data.secondaryColor ?? defaultTheme.secondaryColor,
            secondaryForeground: data.secondaryForeground ?? defaultTheme.secondaryForeground,
            backgroundColor: data.backgroundColor ?? defaultTheme.backgroundColor,
            foregroundColor: data.foregroundColor ?? defaultTheme.foregroundColor,
            borderColor: data.borderColor ?? defaultTheme.borderColor,
            ringColor: data.ringColor ?? defaultTheme.ringColor,
            cardColor: data.cardColor ?? defaultTheme.cardColor,
            cardForeground: data.cardForeground ?? defaultTheme.cardForeground,
            inputColor: data.inputColor ?? defaultTheme.inputColor,
            darkPrimaryColor: data.darkPrimaryColor ?? defaultTheme.darkPrimaryColor,
            darkBackgroundColor: data.darkBackgroundColor ?? defaultTheme.darkBackgroundColor,
            // ✅ ADIÇÕES DE LAYOUT
            headerBgColor: data.headerBgColor ?? defaultTheme.headerBgColor,
            footerBgColor: data.footerBgColor ?? defaultTheme.footerBgColor,
            footerTextColor: data.footerTextColor ?? defaultTheme.footerTextColor,
        } as ThemeState;
    }, []);
    

    useEffect(() => {
        if (currentTheme) {
            setTheme(mapThemeData(currentTheme));
        }
    }, [currentTheme, mapThemeData]);

    const handleChange = (key: keyof ThemeState, value: string) => {
        setTheme(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        saveThemeMutation.mutate(theme);
    };

    if (isLoading) {
        return <div>Carregando configurações de tema...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Aparência do Site</h1>
                <Button type="submit" disabled={isSaving || isLoading}>
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                </Button>
            </div>
            
            {/* --- SEÇÃO: CORES DE LAYOUT (NOVA) --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Cores do Layout Fixo (Header & Footer)</CardTitle>
                    <CardDescription>Defina as cores de fundo e texto para o cabeçalho e rodapé.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Campo para Fundo do Header */}
                    <ColorThemeField 
                        label="Fundo do Cabeçalho (Header)" 
                        value={theme.headerBgColor} 
                        onChange={(v) => handleChange('headerBgColor', v)} 
                        helperText="Cor de fundo do menu fixo superior."
                    />
                    
                    {/* Campo para Fundo do Footer */}
                    <ColorThemeField 
                        label="Fundo do Rodapé (Footer)" 
                        value={theme.footerBgColor} 
                        onChange={(v) => handleChange('footerBgColor', v)} 
                        helperText="Cor de fundo da seção do rodapé."
                    />

                    {/* Campo para Texto do Footer */}
                    <ColorThemeField 
                        label="Texto do Rodapé" 
                        value={theme.footerTextColor} 
                        onChange={(v) => handleChange('footerTextColor', v)} 
                        helperText="Cor do texto principal dentro do rodapé."
                    />
                </CardContent>
            </Card>

            {/* --- SEÇÃO: ESTILO GERAL --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Estilo Geral e Cores Base</CardTitle>
                    <CardDescription>Defina o arredondamento dos elementos e cores básicas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    
                    {/* Raio de Borda é texto puro */}
                    <div className="space-y-2 max-w-sm">
                        <Label htmlFor="borderRadius">Raio de Borda (CSS)</Label>
                        <Input
                            id="borderRadius"
                            value={theme.borderRadius}
                            onChange={(e) => handleChange('borderRadius', e.target.value)}
                            placeholder="Ex: 0.5rem, 8px, 12px"
                        />
                        <p className="text-sm text-muted-foreground">Afeta o arredondamento de todos os componentes.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ColorThemeField label="Fundo (Background)" value={theme.backgroundColor} onChange={(v) => handleChange('backgroundColor', v)} />
                        <ColorThemeField label="Texto (Foreground)" value={theme.foregroundColor} onChange={(v) => handleChange('foregroundColor', v)} />
                        <ColorThemeField label="Borda (Border)" value={theme.borderColor} onChange={(v) => handleChange('borderColor', v)} />
                    </div>
                </CardContent>
            </Card>

            {/* --- SEÇÃO: PALETA PRINCIPAL --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Tema Claro - Paleta Principal</CardTitle>
                    <CardDescription>Defina as cores principais de interação e branding.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ColorThemeField label="Cor Primária (Primary)" value={theme.primaryColor} onChange={(v) => handleChange('primaryColor', v)} />
                    <ColorThemeField label="Texto Primário (Primary Foreground)" value={theme.primaryForeground} onChange={(v) => handleChange('primaryForeground', v)} />
                    <ColorThemeField label="Cor Secundária (Secondary)" value={theme.secondaryColor} onChange={(v) => handleChange('secondaryColor', v)} />
                    <ColorThemeField label="Texto Secundário (Secondary Foreground)" value={theme.secondaryForeground} onChange={(v) => handleChange('secondaryForeground', v)} />
                </CardContent>
            </Card>

            {/* --- SEÇÃO: COMPONENTES --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Tema Claro - Componentes e Inputs</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ColorThemeField label="Fundo de Cartão (Card)" value={theme.cardColor} onChange={(v) => handleChange('cardColor', v)} />
                    <ColorThemeField label="Texto de Cartão (Card Foreground)" value={theme.cardForeground} onChange={(v) => handleChange('cardForeground', v)} />
                    <ColorThemeField label="Inputs e Ring (Input)" value={theme.inputColor} onChange={(v) => handleChange('inputColor', v)} />
                </CardContent>
            </Card>

            {/* --- SEÇÃO: TEMA ESCURO --- */}
            <Card className="border-l-4 border-gray-600">
                <CardHeader>
                    <CardTitle>Tema Escuro (Dark Mode)</CardTitle>
                    <CardDescription>Customização básica para Dark Mode.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ColorThemeField label="Fundo Dark Mode" value={theme.darkBackgroundColor} onChange={(v) => handleChange('darkBackgroundColor', v)} />
                    <ColorThemeField label="Primária Dark Mode" value={theme.darkPrimaryColor} onChange={(v) => handleChange('darkPrimaryColor', v)} />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSaving || isLoading}>
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                </Button>
            </div>
        </form>
    );
}   