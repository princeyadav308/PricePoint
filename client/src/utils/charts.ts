export const generateChartUrls = (sessionData: any, pricingResult: any) => {
    // Neumorphic Exact Brand Colors
    const NAVY = '#0A1628';
    const BLUE = '#0057B8';
    const GOLD = '#DFA81C';

    // Extract basic costs from any of the three unit economics branches
    const pMat = Number(sessionData.answers?.materials_cost?.value) || 0;
    const sLabor = Number(sessionData.answers?.service_labor_cost?.value) || 0;
    const dServer = Number(sessionData.answers?.server_cost?.value) || 0;

    // Approximate a unified breakdown
    const coreCost = pMat + sLabor + dServer || 40;
    const overhead = Number(sessionData.answers?.overhead_cost?.value) || Number(sessionData.answers?.service_overhead_cost?.value) || Number(sessionData.answers?.digital_overhead_cost?.value) || 20;
    const margin = pricingResult?.recommended ? Math.max(0, pricingResult.recommended - (coreCost + overhead)) : 40;

    const dataPie = [coreCost, overhead, margin];
    const labelsPie = ['Core Costs', 'Overhead', 'Gross Margin'];

    const pieChartConfig = {
        type: 'doughnut',
        data: {
            labels: labelsPie,
            datasets: [{
                data: dataPie,
                backgroundColor: [BLUE, NAVY, GOLD],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'sans-serif' } } },
                datalabels: { color: '#ffffff', font: { weight: 'bold' } }
            }
        }
    };

    const pieUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(pieChartConfig))}&w=400&h=400&bkg=transparent`;

    // 2. Market Range Bar Chart
    const budget = pricingResult?.budget || 0;
    const recommended = pricingResult?.recommended || 0;
    const premium = pricingResult?.premium || 0;

    const barChartConfig = {
        type: 'bar',
        data: {
            labels: ['Budget Market', 'Recommended Point', 'Premium Tier'],
            datasets: [{
                label: 'Optimal Price ($)',
                data: [budget, recommended, premium],
                backgroundColor: [BLUE, GOLD, NAVY],
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    };

    const barUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(barChartConfig))}&w=500&h=300&bkg=transparent`;

    return {
        pieChartUrl: pieUrl,
        barChartUrl: barUrl
    };
};
