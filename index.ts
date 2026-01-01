
import { 
    EventsSDK, 
    GameRules, 
    Menu, 
    ObjectManager, 
    TickSleeper,
    RendererSDK, // Импортируем рисовалку
    Color,       // Импортируем цвета
    Vector2      // Импортируем векторы
} from "github.com/octarine-public/wrapper/index";

// === МЕНЮ ===
const entry = Menu.AddEntry("My Scripts");
const node = entry.AddNode("Armlet Debug", "panorama/images/items/armlet_png.vtex_c");
const toggleState = node.AddToggle("Active", true);

console.log("SCRIPT STARTED"); // Это уйдет в отладчик
const sleeper = new TickSleeper();

// === РИСОВАНИЕ НА ЭКРАНЕ (ЧТОБЫ ВИДЕТЬ БЕЗ ОТЛАДЧИКА) ===
EventsSDK.on("Draw", () => {
    // Рисуем текст в координатах 100, 100 (левый верхний угол)
    RendererSDK.Text(
        "ARMLET SCRIPT: LOADED & WORKING", 
        new Vector2(100, 100), 
        Color.Green, 
        undefined, // шрифт дефолтный
        20 // размер шрифта
    );

    if (toggleState.value) {
        RendererSDK.Text("STATE: ON", new Vector2(100, 120), Color.White, undefined, 18);
    } else {
        RendererSDK.Text("STATE: OFF", new Vector2(100, 120), Color.Red, undefined, 18);
    }
});

// === ЛОГИКА ===
EventsSDK.on("Tick", () => {
    if (!toggleState.value || !GameRules || GameRules.IsPaused) return;
    const me = ObjectManager.LocalHero;
    if (!me || !me.IsAlive) return;
    
    // Тут твоя логика армлета...
    const armlet = me.GetItem("item_armlet");
    if (!armlet) return;
    if (sleeper.Sleeping) return;

    if (me.Health < 350) {
         if (me.HasModifier("modifier_item_armlet_unholy_strength")) {
             armlet.Cast();
             sleeper.Sleep(150);
         } else {
             armlet.Cast();
             sleeper.Sleep(100);
         }
    }
});
