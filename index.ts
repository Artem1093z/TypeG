import { EventsSDK, GameRules, Menu, ObjectManager, TickSleeper } from "github.com/octarine-public/wrapper/index";

// === МЕНЮ ===
// 1. Создаем категорию (как "Utility" у Кунки)
const entry = Menu.AddEntry("My Scripts");

// 2. Создаем узел (как "Kunkka AutoStacker")
const node = entry.AddNode("Armlet Abuse", "panorama/images/items/armlet_png.vtex_c");

// 3. Создаем настройки
const toggleState = node.AddToggle("Enable Script", true);
const sliderHP = node.AddSlider("Min HP", 350, 100, 1000);
const sliderDelay = node.AddSlider("Ping Delay (ms)", 100, 0, 500);

// === ЛОГИКА ===
const sleeper = new TickSleeper();
let pendingToggleOn = false;

// Лог для проверки в консоли (localhost:9222)
console.log("[Armlet] Script Loaded!");

EventsSDK.on("Tick", () => {
    // Проверки
    if (!toggleState.value || !GameRules || GameRules.IsPaused) return;
    const me = ObjectManager.LocalHero;
    if (!me || !me.IsAlive) return;

    const armlet = me.GetItem("item_armlet");
    if (!armlet) return;

    if (sleeper.Sleeping) return;

    // Логика ВКЛЮЧЕНИЯ (возврат)
    if (pendingToggleOn) {
        armlet.Cast();
        pendingToggleOn = false;
        sleeper.Sleep(150); // Небольшая пауза
        return;
    }

    // Логика ВЫКЛЮЧЕНИЯ (абуз)
    if (me.Health < sliderHP.value) {
        // Проверяем бафф (включен ли армлет сейчас)
        if (me.HasModifier("modifier_item_armlet_unholy_strength")) {
            // Выключаем
            armlet.Cast();
            pendingToggleOn = true;
            // Ждем задержку перед включением
            sleeper.Sleep(sliderDelay.value);
        } else {
            // Если выключен, но хп мало - включаем
            armlet.Cast();
            sleeper.Sleep(150);
        }
    }
});

EventsSDK.on("GameEnded", () => {
    sleeper.ResetTimer();
    pendingToggleOn = false;
});
