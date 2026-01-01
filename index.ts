import { EventsSDK, ObjectManager, GameRules, Menu } from "github.com/octarine-public/wrapper/index";

// ==========================================================
// 1. НАСТРОЙКА МЕНЮ
// ==========================================================

// Создаем папку "My Armlet" внутри "Custom Scripts"
const PATH = ["Custom Scripts", "My Armlet"];

// Добавляем переключатель (Включить/Выключить)
const menuEnable = Menu.AddToggle(PATH, "Active", false);

// Добавляем ползунок для ХП
const menuMinHP = Menu.AddSlider(PATH, "Threshold HP", 100, 1000, 350, 10);

// Добавляем задержку (пинг)
const menuDelay = Menu.AddSlider(PATH, "Toggle Delay (ms)", 0, 500, 150, 10);


// ==========================================================
// 2. ЛОГИКА СКРИПТА
// ==========================================================

let lastToggleTime = 0;
let pendingToggleOn = false;

console.log("[My Armlet] Script loaded! Check the menu.");

EventsSDK.on("Update", () => {
    // Если скрипт выключен в меню - ничего не делаем
    if (!menuEnable.value) return;

    // Проверки валидности
    if (!GameRules || GameRules.IsPaused()) return;
    const me = ObjectManager.LocalHero;
    if (!me || !me.IsValid() || !me.IsAlive()) return;

    // Читаем настройки прямо из меню (а не из констант)
    const threshold = menuMinHP.value;
    const delay = menuDelay.value;

    const armlet = me.GetItem("item_armlet");
    if (!armlet) return;

    const currentTime = Date.now();

    // Логика возврата (ВКЛЮЧЕНИЕ)
    if (pendingToggleOn) {
        if (currentTime - lastToggleTime >= delay) {
            armlet.Cast(); // Включаем
            pendingToggleOn = false;
            lastToggleTime = currentTime;
        }
        return;
    }

    // Логика абуза (ВЫКЛЮЧЕНИЕ)
    const myHealth = me.Health;

    // Используем threshold из меню
    if (myHealth < threshold && (currentTime - lastToggleTime > 500)) {
        
        // Проверка: включен ли армлет?
        // Используем проверку баффа, так надежнее
        const isArmletActive = me.HasModifier("modifier_item_armlet_unholy_strength");

        if (isArmletActive) {
            armlet.Cast(); // Выключаем
            pendingToggleOn = true;
            lastToggleTime = currentTime;
        } else {
            // Если выключен, но хп мало - просто включаем
            armlet.Cast();
            lastToggleTime = currentTime;
        }
    }
});

// Сброс при начале новой игры
EventsSDK.on("GameStarted", () => {
    pendingToggleOn = false;
    lastToggleTime = 0;
});
