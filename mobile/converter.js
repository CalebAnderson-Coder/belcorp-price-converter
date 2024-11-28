// ==UserScript==
// @name         Belcorp Price Converter
// @version      1.0
// @description  Convierte precios de COP a USD
// @match        https://catalogodigital.somosbelcorp.com/*
// ==/UserScript==

(function() {
    'use strict';

    // Constantes
    const FIXED_COP_RATE = 3100;  // 1 USD = 3100 COP
    const REGULAR_MARKUP = 1.40;   // +40% para productos regulares
    const HEAVY_MARKUP = 1.80;     // +80% para productos pesados
    const HEAVY_THRESHOLD = 700;   // 700 gramos

    // Variables globales
    let isConverting = false;
    let processedElements = new Set();

    // Función para extraer precio numérico
    function extractPrice(text) {
        if (!text || typeof text !== 'string') return 0;
        try {
            const priceMatch = text.match(/\$\s*(\d+(?:\.\d{2})?)/);
            if (!priceMatch) return 0;
            const priceStr = priceMatch[1].replace(/\./g, '');
            return parseInt(priceStr, 10) || 0;
        } catch (error) {
            console.error('Error extrayendo precio:', error);
            return 0;
        }
    }

    // Función para convertir COP a USD
    function convertToUSD(copPrice, isHeavy = false) {
        if (!copPrice || copPrice <= 0) return '0.00';
        try {
            let usdPrice = copPrice / FIXED_COP_RATE;
            usdPrice *= isHeavy ? HEAVY_MARKUP : REGULAR_MARKUP;
            return usdPrice.toFixed(2);
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
                    return weight >= HEAVY_THRESHOLD;
                }
                current = current.parentElement;
            }
            return false;
        } catch (error) {
            console.error('Error detectando peso:', error);
            return false;
        }
    }

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
                        usdSpan.style.color = heavy ? '#ff4444' : '#44aa44';
                        usdSpan.style.fontWeight = 'bold';
                        usdSpan.style.marginLeft = '8px';
                        
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
        notification.style.cssText = `
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
        `;
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
            button.style.background = '#d64d73';
            showNotification(`${count} precios convertidos a USD`);
            
            // Actualización periódica
            window.belcorpInterval = setInterval(() => {
                const newCount = processPrices();
                if (newCount > 0) {
                    showNotification(`${newCount} nuevos precios convertidos`);
                }
            }, 2000);
        } else {
            // Detener actualización y limpiar
            clearInterval(window.belcorpInterval);
            document.querySelectorAll('.belcorp-usd-price').forEach(el => el.remove());
            processedElements.clear();
            button.innerHTML = '💱 Convertir a USD';
            button.style.background = '#e75480';
            showNotification('Precios en COP restaurados');
        }
    }

    // Agregar botón de conversión
    function addConversionButton() {
        if (document.getElementById('belcorp-converter-button')) return;
        
        const button = document.createElement('button');
        button.id = 'belcorp-converter-button';
        button.innerHTML = '💱 Convertir a USD';
        button.style.cssText = `
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
        `;
        button.onclick = toggleConversion;
        document.body.appendChild(button);
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addConversionButton);
    } else {
        addConversionButton();
    }

    // Agregar estilos para la animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -20px); }
            10% { opacity: 1; transform: translate(-50%, 0); }
            90% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
        }
    `;
    document.head.appendChild(style);

    // Iniciar conversión automáticamente
    setTimeout(toggleConversion, 1000);
})();
