// Constantes para los cálculos
const FIXED_COP_RATE = 3100;
const REGULAR_MARKUP = 1.40;
const HEAVY_MARKUP = 1.80;
const HEAVY_WEIGHT_THRESHOLD = 700;

// Función para convertir COP a USD
function convertCOPtoUSD(copAmount, weightInGrams = 0) {
    let usdBase = copAmount / FIXED_COP_RATE;
    if (weightInGrams >= HEAVY_WEIGHT_THRESHOLD) {
        usdBase *= HEAVY_MARKUP;
    } else {
        usdBase *= REGULAR_MARKUP;
    }
    return usdBase.toFixed(2);
}

// Función para formatear precio en USD
function formatUSDPrice(price) {
    return `$${price} USD`;
}

// Función para extraer precio numérico del texto
function extractPrice(priceString) {
    if (!priceString || priceString.includes('USD')) return null;
    
    const cleanString = priceString.trim().replace(/\s+/g, '');
    const matches = cleanString.match(/\$\s*([\d,.]+)/);
    if (!matches) return null;

    const numericString = matches[1].replace(/[,.]/g, '');
    const price = parseInt(numericString);
    
    if (price < 1000 || price > 1000000) return null;
    return price;
}

// Función para extraer peso del producto
function extractWeight(element) {
    const weightTexts = ['ml', 'gr', 'g', 'gramos', 'grs'];
    let currentElement = element;
    let maxDepth = 5;
    
    while (currentElement && maxDepth > 0) {
        const text = currentElement.textContent.toLowerCase();
        for (const weightText of weightTexts) {
            const regex = new RegExp(`(\\d+)\\s*${weightText}`);
            const match = text.match(regex);
            if (match) {
                const weight = parseInt(match[1]);
                // Convertir ml a gramos (aproximación)
                return weightText === 'ml' ? weight : weight;
            }
        }
        currentElement = currentElement.parentElement;
        maxDepth--;
    }
    return 0;
}

// Función para actualizar un elemento de precio
function updatePriceElement(element) {
    if (element.hasAttribute('data-price-converted')) return;
    
    const originalText = element.textContent.trim();
    const priceInCOP = extractPrice(originalText);
    
    if (priceInCOP) {
        const weightInGrams = extractWeight(element);
        const priceInUSD = convertCOPtoUSD(priceInCOP, weightInGrams);
        
        // Crear span para el precio en USD
        const usdSpan = document.createElement('span');
        usdSpan.className = 'belcorp-usd-price';
        usdSpan.style.color = weightInGrams >= HEAVY_WEIGHT_THRESHOLD ? '#ff6b6b' : '#28a745';
        usdSpan.textContent = ` (${formatUSDPrice(priceInUSD)})`;
        
        element.appendChild(usdSpan);
        element.setAttribute('data-price-converted', 'true');
    }
}

// Función principal para actualizar precios
function updatePrices() {
    // Selectores específicos para el catálogo digital
    const priceSelectors = [
        '.price', 
        '.product-price',
        '[class*="price"]',
        '[class*="Price"]',
        'span:contains("$")',
        'div:contains("$")'
    ];

    priceSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            if (!element.hasAttribute('data-price-converted')) {
                updatePriceElement(element);
            }
        });
    });
}

// Observador para cambios dinámicos en la página
function initObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                updatePrices();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Inicialización
function init() {
    // Esperar a que la página cargue completamente
    setTimeout(() => {
        updatePrices();
        initObserver();
    }, 2000);

    // Actualizar periódicamente para capturar cambios dinámicos
    setInterval(updatePrices, 3000);
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Mensaje para confirmar que el script está activo
console.log('Belcorp Price Converter está activo');
