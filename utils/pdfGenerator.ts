import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Settings, SaleRecord, Product } from '../types';
import { blobToDataURL } from './image';
import { formatCurrency, formatPercentage } from './formatting';

interface PDFPaymentStats {
    cash: number;
    card: number;
    token: number;
    check: number;
    paypal: number;
    wero: number;
}

interface PDFAnalytics {
    totalRevenue: number;
    totalDonations: number;
    estimatedFees: number;
    netRevenueAfterFees: number;
    beneficeNet: number;
    totalCostOfGoods: number;
    grossProfit: number;
    cashSales: number;
    cardSales: number;
    checkSales: number;
    paypalSales: number;
    weroSales: number;
    totalRemboursements: number;
    totalCashOuts: number;
    caisseFinaleEspeces: number;
    totalEncaissements: number;
    validSales: SaleRecord[];
    topProductsByQuantity: (Product & { unitsSold: number; revenue: number; totalProfit: number })[];
    topProductsByProfit: (Product & { unitsSold: number; revenue: number; totalProfit: number })[];
    salesByCategory: Array<{ name: string; revenue: number; count: number }>;
    chartData: Array<{ date: string; total: number }>;
    paymentStats: PDFPaymentStats;
}

// Fonction pour configurer les fonts UTF-8 avec support des accents français
const setupFonts = (doc: jsPDF) => {
    try {
        // Note: jsPDF supporte nativement UTF-8 avec les polices standard.
        // Pour les accents français (é, è, ê, à, ç, ü, etc.), utiliser 'helvetica' ou 'times'
        // qui supportent automatiquement le Latin-1 encoding.
        // La police Roboto nécessiterait une intégration complète de la ressource TTF,
        // ce qui n'est pas trivial en base64. Nous utilisons donc helvetica amélioré.
        
        doc.setFont('helvetica', 'normal');
        // jsPDF supporte UTF-8 par défaut avec les polices standard
        // Les caractères spéciaux comme é, è, ê, à, ç seront rendus correctement
    } catch (e) {
        console.warn('Erreur lors de la configuration des fonts, utilisation de la police par défaut:', e);
        doc.setFont('helvetica', 'normal');
    }
};

export const generateAdvancedPDF = async (
    doc: jsPDF,
    analytics: PDFAnalytics,
    settings: Settings,
    period: '7d' | '30d' | 'all',
    isPro: boolean,
    isStandardOrPro: boolean
) => {
    // Configurer les fonts UTF-8 pour les accents français
    setupFonts(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let finalY = 20;

    // Couleurs modernes - TypedArray pour jsPDF
    const colors: Record<string, [number, number, number]> = {
        primary: [37, 99, 235],      // Bleu
        success: [16, 185, 129],     // Vert
        warning: [249, 115, 22],     // Orange
        danger: [239, 68, 68],       // Rouge
        purple: [147, 51, 234],      // Violet
        pink: [236, 72, 153],        // Rose
        cyan: [6, 182, 212],         // Cyan
        gray: [107, 114, 128],       // Gris
    };

    // --- HEADER avec Logo ---
    if (settings.businessLogo) {
        let logoDataUrl = '';
        if (settings.businessLogo instanceof Blob) logoDataUrl = await blobToDataURL(settings.businessLogo);
        else if (typeof settings.businessLogo === 'string' && settings.businessLogo.startsWith('data:')) logoDataUrl = settings.businessLogo;

        if (logoDataUrl) {
            try {
                const img = new Image();
                img.src = logoDataUrl;
                await new Promise(r => { img.onload = r; img.onerror = r; });
                const logoHeight = 16;
                const logoWidth = (img.width * logoHeight) / img.height;
                doc.addImage(logoDataUrl, 'PNG', margin, 12, logoWidth, logoHeight);
                finalY = 35;
            } catch (e) {
                console.error('Logo error:', e);
            }
        }
    }

    // Titre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235);
    doc.text(settings.businessName || 'KAYÉ', pageWidth - margin, finalY, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    const periodText = period === '7d' ? '7 derniers jours' : period === '30d' ? '30 derniers jours' : 'Tout l\'événement';
    doc.text(`Rapport Financier - ${periodText}`, pageWidth - margin, finalY + 8, { align: 'right' });
    doc.text(new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - margin, finalY + 14, { align: 'right' });

    finalY += 25;

    // Safe numeric values (guard analytics to avoid runtime errors)
    const totalRevenue = analytics?.totalRevenue ?? 0;
    const totalDonations = analytics?.totalDonations ?? 0;
    const estimatedFees = analytics?.estimatedFees ?? 0;
    const netRevenueAfterFees = analytics?.netRevenueAfterFees ?? 0;
    const beneficeNet = analytics?.beneficeNet ?? 0;
    const totalCostOfGoods = analytics?.totalCostOfGoods ?? 0;
    const grossProfit = analytics?.grossProfit ?? 0;
    const cashSales = analytics?.cashSales ?? 0;
    const cardSales = analytics?.cardSales ?? 0;
    const paypalSales = analytics?.paypalSales ?? 0;
    const checkSales = analytics?.checkSales ?? 0;
    const weroSales = analytics?.weroSales ?? 0;
    const totalRemboursements = analytics?.totalRemboursements ?? 0;
    const totalCashOuts = analytics?.totalCashOuts ?? 0;
    const caisseFinaleEspeces = analytics?.caisseFinaleEspeces ?? 0;
    const totalEncaissements = analytics?.totalEncaissements ?? 0;
    const validSales = analytics?.validSales ?? [];
    const topProductsByQuantity = analytics?.topProductsByQuantity ?? [];
    const topProductsByProfit = analytics?.topProductsByProfit ?? [];
    const salesByCategory = analytics?.salesByCategory ?? [];
    // paymentStats intentionally not used here — analytics payment breakdown is covered by dedicated fields

    // --- SECTION 1: KPI CARDS ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    // Emoji removed to avoid encoding issues in PDF viewers/fonts
    doc.text('Indicateurs Clés de Performance', margin, finalY);
    finalY += 8;

    // KPI Cards
    const kpiData = [
        { label: 'Chiffre d\'Affaires', value: formatCurrency(totalRevenue), color: colors.primary },
        { label: 'Net Estimé', value: formatCurrency(netRevenueAfterFees), color: colors.success },
        { label: 'Frais Bancaires', value: `-${formatCurrency(estimatedFees)}`, color: colors.danger },
        ...(isPro ? [{ label: 'Bénéfice Net', value: formatCurrency(beneficeNet), color: colors.warning }] : []),
    ];

    const kpiWidth = (pageWidth - margin * 2) / Math.min(kpiData.length, 4);
    kpiData.forEach((kpi, idx) => {
        const x = margin + idx * kpiWidth;
        // Fond coloré
        doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.rect(x, finalY, kpiWidth - 2, 20, 'F');
        // Texte
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(kpi.label, x + 2, finalY + 6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(kpi.value, x + 2, finalY + 14);
    });
    finalY += 28;

    // --- SECTION 2: RÉSUMÉ FINANCIER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    // Emoji removed to avoid encoding issues
    doc.text('Résumé Financier Détaillé', margin, finalY);
    finalY += 6;

    const summaryBody: string[][] = [
        ['Chiffre d\'Affaires Total', `${formatCurrency(totalRevenue)}`, 'CA'],
        ['Total des Dons', `${formatCurrency(totalDonations)}`, 'Dons'],
        ['Total Encaissé', `${formatCurrency(totalEncaissements)}`, 'Trésorerie'],
        ['Frais Bancaires (Est.)', `-${formatCurrency(estimatedFees)}`, 'Frais'],
        ['Net Estimé (après frais)', `${formatCurrency(netRevenueAfterFees)}`, 'Net'],
    ];

    if (isPro) {
        summaryBody.push(
            ['Coût des Marchandises', `-${formatCurrency(totalCostOfGoods)}`, 'COGS'],
            ['Marge Brute', `${formatCurrency(grossProfit)}`, 'Marge'],
            ['Bénéfice Net', `${formatCurrency(beneficeNet)}`, 'Profit'],
            ['Remboursements', `-${formatCurrency(totalRemboursements)}`, 'Refunds'],
            ['Sorties d\'Espèces', `-${formatCurrency(totalCashOuts)}`, 'Cash Out'],
            ['Caisse Finale (Espèces)', `${formatCurrency(caisseFinaleEspeces)}`, 'Caisse'],
        );
    }

    autoTable(doc, {
        startY: finalY,
        head: [['Description', 'Montant', 'Type']],
        body: summaryBody,
        theme: 'grid',
        headStyles: { fillColor: colors.primary as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
        bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 10 },
        alternateRowStyles: { fillColor: [240, 245, 250] },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center', cellWidth: 20 } },
        margin: { left: margin, right: margin },
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;

    // --- SECTION 3: MODES DE PAIEMENT ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    // Emoji removed to avoid encoding issues
    doc.text('Répartition des Modes de Paiement', margin, finalY);
    finalY += 6;

    const paymentMethods = [
        { label: 'Espèces', amount: cashSales, color: colors.success },
        { label: 'Carte Bancaire', amount: cardSales, color: colors.primary },
        { label: 'PayPal', amount: paypalSales, color: colors.cyan },
        { label: 'Chèque', amount: checkSales, color: colors.purple },
        { label: 'Wero', amount: weroSales, color: colors.warning },
    ].filter(m => (m.amount ?? 0) > 0);

    const paymentBody = paymentMethods.map(method => {
        const pct = totalEncaissements > 0 ? ((method.amount / totalEncaissements) * 100) : 0;
        return [
            method.label,
            `${formatCurrency(method.amount)}`,
            `${formatPercentage(pct)}`,
        ];
    });

    autoTable(doc, {
        startY: finalY + 2,
        head: [['Méthode', 'Montant', 'Pourcentage']],
        body: paymentBody,
        theme: 'grid',
        headStyles: { fillColor: colors.primary as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
        bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 10 },
        alternateRowStyles: { fillColor: [240, 245, 250] },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
        margin: { left: margin, right: margin },
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;

    // --- SECTION 4: FRAIS DÉTAILLÉS ---
    if (isPro) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        // Emoji removed to avoid encoding issues
        doc.text('Analyse Détaillée des Frais', margin, finalY);
        finalY += 6;

        const paypalSalesCount = validSales.filter((s: SaleRecord) => s.paymentMethod === 'paypal').length;
        const paypalFees = paypalSales > 0 ? (paypalSales * 0.029) + (paypalSalesCount * 0.35) : 0;
        const sumupFees = (cardSales + totalDonations) * 0.0175;

        const feesBody = [
            ['Frais PayPal (2.9% + 0.35€)', `${formatCurrency(paypalFees)}`, `${(paypalSalesCount)} transactions`],
            ['Frais Sumup (1.75%)', `${formatCurrency(sumupFees)}`, `Cartes + Dons`],
            ['Total Frais Estimés', `${formatCurrency(paypalFees + sumupFees)}`, 'Estimation'],
        ];

        autoTable(doc, {
            startY: finalY,
            head: [['Type de Frais', 'Montant', 'Détails']],
            body: feesBody,
            theme: 'grid',
            headStyles: { fillColor: colors.danger as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
            bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 10 },
            alternateRowStyles: { fillColor: [255, 240, 245] },
            columnStyles: { 1: { halign: 'right' } },
            margin: { left: margin, right: margin },
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- PAGE 2 ---
    if (isStandardOrPro) {
        doc.addPage();
        finalY = 15;

        // Top Produits
            if (topProductsByQuantity.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            // Emoji removed to avoid encoding issues
            doc.text('Top 5 Produits par Quantité', margin, finalY);
            finalY += 6;

                autoTable(doc, {
                startY: finalY,
                head: [['Rang', 'Produit', 'Vendus', 'Chiffre d\'Affaires']],
                body: topProductsByQuantity.slice(0, 5).map((p, i) => [
                    `${i + 1}`,
                    p.name,
                    `${p.unitsSold}`,
                    `${formatCurrency(p.revenue)}`,
                ]),
                theme: 'grid',
                headStyles: { fillColor: colors.success as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
                bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 10 },
                alternateRowStyles: { fillColor: [240, 250, 245] },
                columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
                margin: { left: margin, right: margin },
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Top Produits par Profit (Pro only)
        if (isPro && topProductsByProfit.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            // Emoji removed to avoid encoding issues
            doc.text('Top 5 Produits par Profit', margin, finalY);
            finalY += 6;

                autoTable(doc, {
                startY: finalY,
                head: [['Rang', 'Produit', 'Profit Net', 'Marge %']],
                body: topProductsByProfit.slice(0, 5).map((p, i) => [
                    `${i + 1}`,
                    p.name,
                    `${formatCurrency(p.totalProfit)}`,
                    `${formatPercentage(p.revenue > 0 ? ((p.totalProfit / p.revenue) * 100) : 0)}`,
                ]),
                theme: 'grid',
                headStyles: { fillColor: colors.warning as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
                bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 10 },
                alternateRowStyles: { fillColor: [255, 250, 240] },
                columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
                margin: { left: margin, right: margin },
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Catégories
        if (salesByCategory.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            // Emoji removed to avoid encoding issues
            doc.text('Ventes par Catégorie', margin, finalY);
            finalY += 6;

            autoTable(doc, {
                startY: finalY,
                head: [['Catégorie', 'Revenu', 'Nombre de Ventes', 'Panier Moyen']],
                body: salesByCategory.map(c => [
                    c.name,
                    `${formatCurrency(c.revenue)}`,
                    `${c.count}`,
                    `${c.count > 0 ? formatCurrency(c.revenue / c.count) : formatCurrency(0)}`,
                ]),
                theme: 'grid',
                headStyles: { fillColor: colors.primary as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
                bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 10 },
                alternateRowStyles: { fillColor: [240, 245, 250] },
                columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
                margin: { left: margin, right: margin },
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Historique des ventes détaillé
        if (validSales.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            // Emoji removed to avoid encoding issues
            doc.text('Historique Détaillé des Ventes', margin, finalY);
            finalY += 6;

            const maxSalesInPDF = 50; // Limiter à 50 ventes pour ne pas rendre le PDF trop lourd
            const salesData = validSales.slice(0, maxSalesInPDF).map((sale, idx) => {
                const itemsSummary = sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ').substring(0, 40);
                const cogs = sale.items.reduce((sum, i) => sum + ((i.purchasePrice || 0) * i.quantity), 0);
                const paypalFeeForSale = sale.paymentMethod === 'paypal' ? (sale.total * 0.029) + 0.35 : 0;
                const sumupFeeForSale = sale.paymentMethod === 'card' ? sale.total * 0.0175 : 0;
                const totalFees = paypalFeeForSale + sumupFeeForSale;
                const grossProfit = sale.total - cogs;
                const netProfit = grossProfit - totalFees;

                return [
                    `${idx + 1}`,
                    new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    itemsSummary,
                    `${formatCurrency(sale.total)}`,
                    `${formatCurrency(totalFees)}`,
                    `${formatCurrency(netProfit)}`,
                    sale.paymentMethod,
                ];
            });

            autoTable(doc, {
                startY: finalY,
                head: [['#', 'Heure', 'Articles', 'Montant', 'Frais', 'Profit Net', 'Mode']],
                body: salesData,
                theme: 'grid',
                headStyles: { fillColor: colors.cyan as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold', font: 'helvetica', fontSize: 10 },
                bodyStyles: { textColor: [0, 0, 0], font: 'helvetica', fontSize: 8 },
                alternateRowStyles: { fillColor: [245, 250, 250] },
                columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
                margin: { left: margin, right: margin },
                didDrawPage: function (data: any) {
                    // Footer
                    const pageCount = (doc as any).internal.getNumberOfPages();
                    const pageSize = doc.internal.pageSize;
                    const pageHeight = pageSize.getHeight();
                    const pageWidth = pageSize.getWidth();

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    doc.setTextColor(150);
                    doc.text(`Page ${data.pageNumber} sur ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
                    doc.text(`Rapport généré par KAYÉ - ${new Date().toLocaleDateString('fr-FR')}`, margin, pageHeight - 10);
                },
            });
        }
    }

    // --- FOOTER ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.line(margin, doc.internal.pageSize.getHeight() - 15, pageWidth - margin, doc.internal.pageSize.getHeight() - 15);
        doc.text(`Page ${i} sur ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
        doc.text(`Rapport généré par KAYÉ - ${new Date().toLocaleDateString('fr-FR')}`, margin, doc.internal.pageSize.getHeight() - 10);
    }
};
