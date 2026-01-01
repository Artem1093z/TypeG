
// Импортируем только то, что есть в официальном примере + ObjectManager для героя
import {
    EventsSDK,
    GameRules,
    Menu,
    ObjectManager,
    TickSleeper
} from "github.com/octarine-public/wrapper/index"

// ==========================================================
// 1. НАСТРОЙКА МЕНЮ (По новому стандарту)
// ==========================================================

// Создаем главную категорию в меню
const entry = Menu.AddEntry("My Scripts")

// Создаем подраздел с иконкой армлета
const tree = entry.AddNode("Armlet Abuse", "panorama/images/items/armlet_png.vtex_c")

// Добавляем настройки
const State = tree.AddToggle("Active", false)
const MinHP = tree.AddSlider("HP Threshold", 350, 100, 1000)
const Delay = tree.AddSlider("Toggle Delay (ms)", 150, 0, 500)

// Используем слипер для задержек (как в примере Kunkka)
const sleeper = new TickSleeper()
let pendingToggleOn = false

// ==========================================================
// 2. ЛОГИКА
// ==========================================================

EventsSDK.on("Tick", () => {
    // Базовые проверки: скрипт включен? игра идет? паузы нет?
    if (!State.value || !GameRules || GameRules.IsPaused) {
        return
    }

    // Получаем нашего героя
    const me = ObjectManager.LocalHero
    if (!me || !me.IsAlive) {
        return
    }

    // Ищем армлет
    const armlet = me.GetItem("item_armlet")
    if (!armlet) {
        return
    }

    // Если "спим" (ждем задержку) - выходим
    if (sleeper.Sleeping) {
        return
    }

    // --- ЛОГИКА ВОЗВРАТА (ВКЛЮЧЕНИЕ) ---
    if (pendingToggleOn) {
        armlet.Cast() // Включаем обратно
        pendingToggleOn = false
        // Небольшая задержка после включения, чтобы не спамить
        sleeper.Sleep(100)
        return
    }

    // --- ЛОГИКА АБУЗА (ВЫКЛЮЧЕНИЕ) ---
    const myHealth = me.Health
    
    // Если здоровье меньше порога (из меню)
    if (myHealth < MinHP.value) {
        
        // Проверяем, включен ли армлет (через модификатор или свойство)
        // В примере Кунки свойства смотрят через методы, попробуем IsToggled если есть, или бафф
        const hasBuff = me.HasModifier("modifier_item_armlet_unholy_strength")

        if (hasBuff) {
            // 1. Выключаем
            armlet.Cast()
            
            // 2. Говорим, что надо включить обратно
            pendingToggleOn = true
            
            // 3. Ждем указанную задержку (из меню) перед следующим шагом
            sleeper.Sleep(Delay.value)
        } else {
            // Если выключен, но хп мало - просто включаем
            armlet.Cast()
            sleeper.Sleep(100)
        }
    }
})

// Сброс таймеров при конце игры
EventsSDK.on("GameEnded", () => {
    sleeper.ResetTimer()
    pendingToggleOn = false
})
