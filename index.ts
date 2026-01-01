// Импортируем необходимые модули из враппера
// ВАЖНО: Проверьте, что ObjectManager и другие классы экспортируются в wrapper/index.ts
import { EventsSDK, ObjectManager, GameRules } from "github.com/octarine-public/wrapper/index";

// Настройки скрипта
const CONFIG = {
    MinHP: 350,              // Порог ХП для абуза
    ArmletName: "item_armlet",
    ToggleDelay: 150,        // Задержка в мс между выкл и вкл (зависит от пинга)
    SafeMode: true           // Не переключать, если мы невидимы (Riki/Bounty Hunter)
};

// Переменные состояния
let lastToggleTime = 0;
let pendingToggleOn = false; // Флаг ожидания включения

console.log("[ArmletScript] Loaded successfully!");

// Подписываемся на обновление кадра (Update или GameLoop)
EventsSDK.on("Update", () => {
    // 1. Проверяем, в игре ли мы
    if (!GameRules || GameRules.IsPaused()) return;

    // 2. Получаем своего героя
    const me = ObjectManager.LocalHero;
    if (!me || !me.IsValid() || !me.IsAlive()) return;

    // 3. Проверка на инвиз (опционально, чтобы не спалиться)
    if (CONFIG.SafeMode && me.IsInvisible()) return;

    // 4. Ищем Армлет
    // Внимание: метод может называться GetItem, FindItem или Inventory.GetItem
    // Проверьте во враппере!
    const armlet = me.GetItem(CONFIG.ArmletName); 
    
    // Если армлета нет
    if (!armlet) return;

    const currentTime = Date.now();

    // --- ЛОГИКА ВТОРОЙ ЧАСТИ (ВКЛЮЧЕНИЕ) ---
    // Если мы выключили армлет и ждем задержку перед включением
    if (pendingToggleOn) {
        if (currentTime - lastToggleTime >= CONFIG.ToggleDelay) {
            // Включаем обратно
            armlet.Cast(); // Или armlet.Toggle() или armlet.Use()
            pendingToggleOn = false;
            lastToggleTime = currentTime;
            console.log("[ArmletScript] Re-enabled!");
        }
        return; // Больше ничего не делаем в этом кадре
    }

    // --- ЛОГИКА ПЕРВОЙ ЧАСТИ (ПРОВЕРКА ХП) ---
    
    // Получаем текущее здоровье
    const myHealth = me.Health; // Или me.GetHealth()

    // Если ХП меньше порога и прошло достаточно времени с последнего переключения
    if (myHealth < CONFIG.MinHP && (currentTime - lastToggleTime > 500)) {
        
        // Если Армлет сейчас ВКЛЮЧЕН (дает силу, но отнимает ХП)
        // Враппер может иметь свойство IsToggled, IsActive или GetToggleState()
        if (armlet.IsToggled()) { 
            // 1. Выключаем (HP упадет до 1)
            armlet.Cast(); 
            
            // 2. Ставим флаг, что нужно включить обратно
            pendingToggleOn = true;
            lastToggleTime = currentTime;
            console.log("[ArmletScript] Disabled, waiting to re-enable...");
        } 
        // Если Армлет выключен, но ХП все равно мало (экстренная ситуация)
        else {
            armlet.Cast();
            lastToggleTime = currentTime;
        }
    }
});

// Слушатель начала игры для сброса переменных
EventsSDK.on("GameStarted", () => {
    console.log("[ArmletScript] New Game Started");
    pendingToggleOn = false;
    lastToggleTime = 0;
});