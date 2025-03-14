document.addEventListener("DOMContentLoaded", () => {
    let dictionary = [];
    const shapes = ['circle', 'square', 'triangle', 'rectangle', 'diamond', 'oval'];
    const shapeTranslations = {
        "circle": "Круг",
        "square": "Квадрат",
        "triangle": "Треугольник",
        "rectangle": "Прямоугольник",
        "diamond": "Ромб",
        "oval": "Овал"
    };
    
    
    fetch('slovar.txt')
        .then(response => response.text())
        .then(data => dictionary = data.split('\n').map(word => word.trim()))
        .catch(error => console.error('Ошибка загрузки словаря:', error));

    const levelButtons = document.querySelectorAll(".level-btn");
    const typeButtons = document.querySelectorAll(".type-btn");
    const startButton = document.getElementById("start-btn");
    const display = document.getElementById("display");
    const userInput = document.getElementById("user-input");
    const submitButton = document.querySelector(".submit-btn");
    const scoreDisplay = document.getElementById("score");
    const modal = document.getElementById("result-modal");
    const modalText = document.getElementById("result-text");
    const errorDetails = document.getElementById("error-details");
    const closeModal = document.querySelector(".close");

    let shapePicker = null;
    let correctShapes = [];
    let selectedShapes = [];
    let selectedLevel = null;
    let selectedType = null;
    let correctSequence = "";
    let score = 0;
    let gameOver = false;

    const levels = {
        1: { digits: 4, words: 1, shapes: 1, time: 10, multiplier: 1 },
        2: { digits: 6, words: 2, shapes: 2, time: 8, multiplier: 2 },
        3: { digits: 8, words: 3, shapes: 3, time: 6, multiplier: 3 },
        4: { digits: 10, words: 4, shapes: 4, time: 4, multiplier: 4 }
    };

    function initShapePicker() {
        shapePicker = document.createElement('div');
        shapePicker.className = 'shape-picker';
        
        shapes.forEach(shape => {
            const div = document.createElement('div');
            div.className = `shape ${shape}`;
            
            div.addEventListener('click', () => {
                if (gameOver || !shapePicker.style.pointerEvents) return;
                
                const index = selectedShapes.indexOf(shape);
                if (index === -1) {
                    if (selectedShapes.length < levels[selectedLevel].shapes) {
                        selectedShapes.push(shape);
                    }
                } else {
                    selectedShapes.splice(index, 1);
                }
                updateShapeSelection();
            });
            
            shapePicker.appendChild(div);
        });
        
        document.querySelector('.input-container').prepend(shapePicker);
    }

    function updateShapeSelection() {
        shapePicker.querySelectorAll('.shape').forEach((s, i) => {
            s.classList.remove('selected');
            s.removeAttribute('data-order');
            
            const shape = shapes[i];
            const index = selectedShapes.indexOf(shape);
            
            if (index !== -1) {
                s.setAttribute('data-order', index + 1);
                s.classList.add('selected');
            }
        });
    }

    function generateSequence() {
        const levelConfig = levels[selectedLevel];
        
        if (selectedType === 'shapes') {
            correctShapes = [];
            const shuffled = [...shapes].sort(() => 0.5 - Math.random());
            correctShapes = shuffled.slice(0, levelConfig.shapes);
            
            display.innerHTML = '';
            correctShapes.forEach(shape => {
                const div = document.createElement('div');
                div.className = `shape ${shape}`;
                display.appendChild(div);
            });
        } else {
            if (selectedType === "numbers") {
                correctSequence = Array.from({length: levelConfig.digits}, 
                    () => Math.floor(Math.random() * 10)).join("");
            } else if (selectedType === "words") {
                correctSequence = Array.from({length: levelConfig.words}, 
                    () => dictionary[Math.floor(Math.random() * dictionary.length)]).join(" ");
            }
            display.textContent = correctSequence;
        }
    }

    levelButtons.forEach(button => {
        button.addEventListener("click", () => {
            levelButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            selectedLevel = parseInt(button.dataset.level);
            typeButtons.forEach(btn => btn.disabled = false);
        });
    });

    typeButtons.forEach(button => {
        button.addEventListener("click", () => {
            typeButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            selectedType = button.dataset.type;
            
            if (selectedType === 'shapes') {
                if (!shapePicker) initShapePicker();
                shapePicker.style.display = 'grid';
                userInput.style.display = 'none';
            } else {
                if (shapePicker) shapePicker.style.display = 'none';
                userInput.style.display = 'block';
            }
            
            startButton.disabled = false;
        });
    });

    startButton.addEventListener("click", () => {
        gameOver = false;
        submitButton.disabled = false;
        scoreDisplay.textContent = score;
        selectedShapes = [];
        
        if (shapePicker) {
            shapePicker.style.pointerEvents = 'none';
            shapePicker.querySelectorAll('.shape').forEach(s => {
                s.classList.remove('selected');
                s.removeAttribute('data-order');
            });
        }

        generateSequence();
        if (selectedType !== 'shapes') {
            userInput.disabled = true;
        }
        submitButton.disabled = true;
    
        setTimeout(() => {
            display.innerHTML = '';
            if (selectedType === 'shapes') {
                shapePicker.style.pointerEvents = 'auto';
            } else {
                userInput.disabled = false;
            }
            submitButton.disabled = false;
        }, levels[selectedLevel].time * 1000);
    });

    submitButton.addEventListener("click", () => {
        if (gameOver) return;
    
        let points = 100 * levels[selectedLevel].multiplier;
        let penalty = 0;
        let errorMessage = "";
        let penaltyDetails = "";
        let errors = [];
        let resultHtml = "";
    
        if (selectedType === 'shapes') {
            if (selectedShapes.length !== correctShapes.length) {
                points = 0;
                errors.push(`Выбрано ${selectedShapes.length} из ${correctShapes.length} фигур`);
            } 
            else if (selectedShapes.join() === correctShapes.join()) {
                points = 100 * levels[selectedLevel].multiplier;
            }
            else {
                const allCorrect = selectedShapes.every(shape => correctShapes.includes(shape));
                points = allCorrect ? 
                    Math.floor(100 * levels[selectedLevel].multiplier / 2) : 
                    0;
                errors.push(allCorrect ? 
                    'Правильные фигуры, но неверный порядок' : 
                    'Есть неверные фигуры');
            }
            
            resultHtml = `
            Ваш выбор: ${selectedShapes.map(s => shapeTranslations[s]).join(', ')}<br>
            Правильная последовательность: ${correctShapes.map(s => shapeTranslations[s]).join(', ')}<br>
            Очки за раунд: ${points}
        `;
            
        } else if (selectedType === "numbers") {
            let userAnswer = userInput.value.trim();
            
            if (userAnswer.length > levels[selectedLevel].digits) {
                userAnswer = userAnswer.slice(0, levels[selectedLevel].digits);
                errorMessage += `Введено больше цифр, чем требовалось. Лишние цифры были отброшены.<br>`;
            }
            
            if (userAnswer !== correctSequence) {
                let correctArray = correctSequence.split("");
                let userArray = userAnswer.split("");
                let minLength = Math.max(correctArray.length, userArray.length);
    
                for (let i = 0; i < minLength; i++) {
                    if (correctArray[i] !== userArray[i]) {
                        penalty += Math.floor(points / correctArray.length);
                        errors.push(`В ${i + 1}-й цифре должно было быть '${correctArray[i]}', но вы ввели '${userArray[i] || " ничего "}'. Штраф: -${Math.floor(points / correctArray.length)} очков.<br>`);
                    }
                }
                points -= penalty;
            }
            
            resultHtml = `
                Ваш ответ: ${userAnswer}<br>
                Правильный ответ: ${correctSequence}<br>
                Очки за раунд: ${Math.max(points, 0)}
            `;
            
        } else {
            // Логика для слов
            const userAnswer = userInput.value.trim();
            const userWords = userAnswer.split(" ").filter(word => word !== "");
            const correctWords = correctSequence.split(" ");
        
            // Если количество слов не совпадает, начисляем 0 очков
            if (userWords.length !== correctWords.length) {
                points = 0;
                errors.push(`Вы ввели ${userWords.length} слов, а должно быть ${correctWords.length}.`);
            }
        
            // Проверяем наличие каждого введенного слова в правильной последовательности
            userWords.forEach(word => {
                if (!correctWords.includes(word)) {
                    errors.push(`Слово '${word}' не встречается в правильной последовательности.`);
                }
            });
        
            if (errors.length === 0) {
                let isSequenceCorrect = true;
                for (let i = 0; i < correctWords.length; i++) {
                    if (userWords[i] !== correctWords[i]) {
                        isSequenceCorrect = false;
                        errors.push(`Нарушена последовательность: '${userWords[i]}' вместо '${correctWords[i]}'`);
                        break;
                    }
                }
                points = isSequenceCorrect ? 100 * levels[selectedLevel].multiplier : Math.floor(100 * levels[selectedLevel].multiplier / 2);
            } else {
                points = 0;
            }
        
            resultHtml = `
                Ваш ответ: ${userAnswer}<br>
                Правильный ответ: ${correctSequence}<br>
                Очки за раунд: ${points}
            `;
        }
    
        score += Math.max(points, 0);
        scoreDisplay.textContent = score;
    
        if (selectedType === "numbers") {
            if (penalty > 0) {
                resultHtml += `<br>Штрафные очки: ${penalty}<br><br>${penaltyDetails}`;
                errorDetails.style.display = "block";
            } else {
                errorDetails.style.display = "none";
            }
        }
    
        if (errors.length === 0) {
            resultHtml += "<br>Ошибок нет!";
        } else {
            resultHtml += "Ошибки:<br>" + errors.join("<br>");
        }
    
        modalText.innerHTML = resultHtml;
        modal.style.display = "block";
        gameOver = true;
        submitButton.disabled = true;
        
        if (selectedType !== 'shapes') {
            userInput.value = "";
        }
    });
    
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });
    
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
    
    userInput.addEventListener("input", () => {
        if (selectedType === "numbers" && /\D/.test(userInput.value)) {
            userInput.value = userInput.value.replace(/\D/g, "");
        } else if (selectedType === "words" && /\d/.test(userInput.value)) {
            userInput.value = userInput.value.replace(/\d/g, "");
        }
    
        if (selectedType === "numbers" && userInput.value.length > levels[selectedLevel].digits) {
            userInput.value = userInput.value.slice(0, levels[selectedLevel].digits);
        }
    });

// Модальные окна и элементы
const authModals = {
    login: document.getElementById('login-modal'),
    register: document.getElementById('register-modal'),
    overlay: document.querySelector('.modal-overlay')
};

// Показать модальное окно
function showModal(modalId) {
    authModals.overlay.style.display = 'block';
    document.getElementById(modalId).style.display = 'block';
    setTimeout(() => {
        authModals.overlay.classList.add('active');
        document.getElementById(modalId).classList.add('active');
    }, 10);
}

// Модифицируем функцию скрытия модальных окон
function hideModals(currentModal = null) {
    // Плавное скрытие только активного модального окна
    if (currentModal) {
        currentModal.classList.remove('active');
        authModals.overlay.classList.remove('active');
        
        setTimeout(() => {
            currentModal.style.display = 'none';
            authModals.overlay.style.display = 'none';
        }, 300);
    } else {
        // Скрытие всех модалок (при закрытии через оверлей/ESC)
        authModals.overlay.classList.remove('active');
        document.querySelectorAll('.modal-auth.active').forEach(modal => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                authModals.overlay.style.display = 'none';
            }, 300);
        });
    }
}
// Обработчики открытия модалок
document.querySelectorAll('[data-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetModal = e.target.dataset.target;
        showModal(targetModal);
    });
});

// Закрытие по клику на оверлей
authModals.overlay.addEventListener('click', hideModals);

// Закрытие по ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModals();
});

// Переключение между модалками
document.querySelectorAll('.switch-auth a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const currentModal = e.target.closest('.modal-auth');
        const targetModal = e.target.dataset.target;
        
        // Сначала скрываем текущее модальное окно
        hideModals(currentModal);
        
        // После завершения анимации открываем новое
        setTimeout(() => {
            showModal(targetModal);
        }, 300);
    });
});

// Обработка формы регистрации
document.querySelector('#register-modal form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const passwords = e.target.querySelectorAll('input[type="password"]');
    if (passwords[0].value !== passwords[1].value) {
        alert('Пароли не совпадают!');
        return;
    }
    
    // Здесь должна быть логика регистрации
    alert('Регистрация успешна!');
    hideModals();
});

// Обработка формы входа
document.querySelector('#login-modal form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Здесь должна быть логика авторизации
    alert('Вход выполнен!');
    hideModals();
});

// Валидация паролей в реальном времени
document.querySelectorAll('#register-modal input[type="password"]').forEach(input => {
    input.addEventListener('input', () => {
        const [pass1, pass2] = document.querySelectorAll('#register-modal input[type="password"]');
        if (pass1.value && pass2.value && pass1.value !== pass2.value) {
            pass2.setCustomValidity('Пароли не совпадают');
        } else {
            pass2.setCustomValidity('');
        }
    });
});

// Анимация облачка
function animateCloud() {
    const cloud = document.querySelector('.cloud-animation');
    if (cloud) {
        let position = -200;
        setInterval(() => {
            position = (position >= 200) ? -200 : position + 0.5;
            cloud.style.transform = `translateX(${position}%)`;
        }, 50);
    }
}
animateCloud();

// Закрытие по клику на крестик
document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        hideModals();
    });
});
});
