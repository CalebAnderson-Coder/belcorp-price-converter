javascript:(function(){
    // Constantes de conversión
    const FIXED_COP_RATE = 3100;  // 1 USD = 3100 COP

    // Función para extraer precio numérico
    function extractPrice(text) {
        if (!text || typeof text !== 'string') return 0;
        
        try {
            const priceMatch = text.match(/\$\s*(\d+(?:\.\d{2})?)/);
            if (!priceMatch) return 0;

            let priceStr = priceMatch[1].split('.')[0];
            const price = parseInt(priceStr, 10);
            return price || 0;
        } catch (error) {
            console.error('Error extrayendo precio:', error);
            return 0;
        }
    }

    // Función para convertir precio de COP a USD
    function convertToUSD(copPrice, isHeavy = false) {
        if (!copPrice || copPrice <= 0) return '0.00';
        
        try {
            // 1. Convertir COP a USD base (1 USD = 3100 COP)
            let finalUSD = copPrice / FIXED_COP_RATE;
            
            // 2. Aplicar markup según el peso
            finalUSD = isHeavy ? (finalUSD * 1.80) : (finalUSD * 1.40);

            // 3. Redondear a 2 decimales
            return finalUSD.toFixed(2);
        } catch (error) {
            console.error('Error en conversión:', error);
            return '0.00';
        }
    }

    // Función para detectar productos pesados
    function isHeavyProduct(element) {
        try {
            if (!element) return false;
            let current = element;
            while (current && current !== document.body) {
                const text = current.textContent || '';
                const weightMatch = text.match(/(\d+)\s*(?:g|gr|grs|gramos|ml|mililitros|oz|onzas)/i);
                if (weightMatch) {
                    const weight = parseInt(weightMatch[1], 10);
                    return weight >= 700;
                }
                current = current.parentElement;
            }
            return false;
        } catch (error) {
            console.error('Error detectando peso:', error);
            return false;
        }
    }

    // Agregar estilos CSS
    const style = document.createElement('style');
    style.textContent = `
        .belcorp-usd-price {
            color: #44aa44;
            font-weight: bold;
            font-size: 0.9em;
            margin-left: 8px;
            display: inline;
        }
        .heavy-product {
            color: #ff4444;
        }
        #belcorp-converter-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #e75480;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            border: none;
            cursor: pointer;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        #belcorp-converter-button:active {
            transform: scale(0.98);
        }
        .belcorp-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(231, 84, 128, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: fadeInOut 3s forwards;
        }
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -20px); }
            10% { opacity: 1; transform: translate(-50%, 0); }
            90% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
        }
    `;
    document.head.appendChild(style);

    // Variables globales
    let isConverting = false;
    const processedElements = new Set();

    // Función para procesar precios
    function processPrices() {
        const priceElements = document.querySelectorAll('*');
        let convertedCount = 0;

        priceElements.forEach(el => {
            if (processedElements.has(el)) return;

            const text = el.textContent || '';
            if (text.includes('$') && !text.includes('USD')) {
                const copPrice = extractPrice(text);
                if (copPrice > 0) {
                    const heavy = isHeavyProduct(el);
                    const usdPrice = convertToUSD(copPrice, heavy);
                    
                    if (usdPrice !== '0.00') {
                        const usdSpan = document.createElement('span');
                        usdSpan.className = `belcorp-usd-price ${heavy ? 'heavy-product' : ''}`;
                        usdSpan.textContent = ` ($${usdPrice} USD)`;
                        
                        if (el.nextSibling) {
                            el.parentNode.insertBefore(usdSpan, el.nextSibling);
                        } else {
                            el.parentNode.appendChild(usdSpan);
                        }
                        
                        processedElements.add(el);
                        convertedCount++;
                    }
                }
            }
        });

        return convertedCount;
    }

    // Función para mostrar notificación
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'belcorp-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Función para alternar conversión
    function toggleConversion() {
        const button = document.getElementById('belcorp-converter-button');
        isConverting = !isConverting;
        
        if (isConverting) {
            const count = processPrices();
            button.innerHTML = '💱 Actualizar precios';
            showNotification(`${count} precios convertidos a USD`);
            
            // Iniciar actualización periódica
            window.belcorpInterval = setInterval(() => {
                const newCount = processPrices();
                if (newCount > 0) {
                    showNotification(`${newCount} nuevos precios convertidos`);
                }
            }, 2000);
        } else {
            // Detener actualización y eliminar precios USD
            clearInterval(window.belcorpInterval);
            document.querySelectorAll('.belcorp-usd-price').forEach(el => el.remove());
            processedElements.clear();
            button.innerHTML = '💱 Convertir a USD';
            showNotification('Precios en COP restaurados');
        }
    }

    // Agregar botón de conversión si no existe
    if (!document.getElementById('belcorp-converter-button')) {
        const button = document.createElement('button');
        button.id = 'belcorp-converter-button';
        button.innerHTML = '💱 Convertir a USD';
        button.onclick = toggleConversion;
        document.body.appendChild(button);
    }

    // Iniciar conversión automáticamente
    toggleConversion();
})();
