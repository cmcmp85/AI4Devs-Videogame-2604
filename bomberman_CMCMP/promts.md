Bomberman con Phaser 3 

Prompt 1 — Estructura del proyecto

Crea la estructura de carpetas y archivos base para un juego de Bomberman usando Phaser 3.
La carpeta raíz es  bomberman_CMCMP. Dentro crea:
- index.html (punto de entrada del juego)
- css/style.css (estilos generales)
- js/main.js (configuración principal de Phaser)
- js/scenes/BootScene.js (carga de assets)
- js/scenes/GameScene.js (lógica principal del juego)
- js/scenes/UIScene.js (interfaz: vidas, puntuación, timer)
- assets/images/ (carpeta para sprites)
- assets/audio/ (carpeta para sonidos)

El index.html debe cargar Phaser 3 desde CDN (https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js)
y todos los archivos JS en el orden correcto. El CSS debe centrar el canvas en pantalla
con fondo negro.

Prompt 2 — Generación de assets con canvas

En BootScene.js, en lugar de cargar imágenes externas, genera todos los sprites del juego
programáticamente usando Phaser Graphics y renderizándolos a texturas. Crea las siguientes texturas:

- 'player': sprite del jugador (16x16px), color azul con detalle blanco
- 'enemy': sprite de enemigo (16x16px), color rojo
- 'wall': bloque sólido indestructible (48x48px), color gris oscuro con borde
- 'brick': bloque destructible (48x48px), color marrón con patrón de ladrillo
- 'floor': suelo (48x48px), color gris claro
- 'bomb': bomba (40x40px), esfera negra con mecha
- 'explosion_center': centro de explosión (48x48px), naranja brillante
- 'explosion_h': explosión horizontal (48x48px), naranja alargado horizontal
- 'explosion_v': explosión vertical (48x48px), naranja alargado vertical
- 'powerup_fire': power-up de rango (32x32px), icono de llama rojo
- 'powerup_bomb': power-up de bomba extra (32x32px), icono de bomba negro

Usa this.make.graphics() y generateTexture(). Una vez generadas las texturas, inicia GameScene.

Prompt 3 — Mapa y escenario

En GameScene.js implementa la generación del mapa del juego Bomberman:

1. Define el mapa como una matriz 2D de 15 columnas x 13 filas usando tiles de 48x48px.
2. El borde exterior completo debe ser 'wall' (indestructible).
3. En el interior coloca 'wall' en las posiciones donde tanto la fila como la columna son pares
   (patrón clásico de Bomberman).
4. El resto de posiciones interiores: 70% probabilidad de 'brick' (destructible), 30% 'floor'.
5. Garantiza que las 4 esquinas jugables (y sus adyacentes) estén siempre despejadas
   para que el jugador pueda moverse al inicio.
6. Usa StaticGroup de Phaser para 'walls' y 'bricks' por separado.
7. Dibuja el suelo primero como capa base para todas las celdas.
8. Calcula el tamaño del canvas automáticamente: columnas*48 x filas*48.

Prompt 4 — Jugador y movimiento

En GameScene.js implementa el jugador con las siguientes características:

1. Crea un sprite del jugador en la posición inicial (columna 1, fila 1) usando el tile 'player'.
2. Movimiento con teclas de cursor (arriba, abajo, izquierda, derecha) y WASD.
3. Velocidad de movimiento: 150px/s.
4. Colisión del jugador con 'walls' y 'bricks' usando physics.add.collider.
5. Alinea el movimiento a la cuadrícula para evitar que el jugador quede atascado entre tiles:
   cuando se mueva horizontalmente, ajusta suavemente la Y al centro del tile más cercano,
   y viceversa para movimiento vertical.
6. Usa Phaser Arcade Physics para el jugador.
7. El jugador empieza con: maxBombs=1, bombRange=2, lives=3.
8. Cuando el jugador colisiona con un enemigo pierde una vida. Si llega a 0, muestra
   game over.

Prompt 5 — Sistema de bombas y explosiones

Implementa el sistema completo de bombas en GameScene.js:

1. Al pulsar SPACE o la tecla X, el jugador coloca una bomba en la celda en la que está,
   si no hay ya una bomba en esa celda y no ha superado su límite de bombas activas.
2. La bomba es un sprite que aparece en el centro del tile correspondiente.
3. Tras 3 segundos, la bomba explota:
   a. Crea una explosión en la celda de la bomba (explosion_center).
   b. Propaga la explosión en las 4 direcciones hasta bombRange celdas,
      parando si encuentra una 'wall'. Si encuentra un 'brick', lo destruye
      y para la propagación en esa dirección. Usa 'explosion_h' y 'explosion_v'
      según la dirección.
   c. Cada celda de explosión dura 0.6 segundos y luego desaparece.
4. Si la explosión alcanza otra bomba, esa bomba explota inmediatamente (reacción en cadena).
5. Si la explosión alcanza al jugador, pierde una vida.
6. Si la explosión alcanza a un enemigo, el enemigo muere y suma puntos.
7. Al destruir un 'brick', hay un 20% de probabilidad de que aparezca un power-up.
8. Cuando la bomba explota, se devuelve al contador de bombas disponibles del jugador.

Prompt 6 — Enemigos con IA

Implementa los enemigos en GameScene.js:

1. Crea 3 enemigos en posiciones aleatorias del mapa (celdas de tipo floor, lejos del jugador).
2. Cada enemigo se mueve aleatoriamente por el mapa:
   - Elige una dirección (arriba, abajo, izquierda, derecha) aleatoriamente.
   - Se mueve en esa dirección a 80px/s hasta llegar al centro del siguiente tile.
   - Si hay un obstáculo (wall o brick) elige otra dirección.
   - Cambia de dirección aleatoriamente cada 1-3 segundos aunque no haya obstáculo.
3. Usa un Phaser Group para gestionar todos los enemigos.
4. Cada enemigo tiene colisión con walls y bricks.
5. Al matar un enemigo suma 100 puntos.
6. Si todos los enemigos mueren, muestra un mensaje de victoria y permite reiniciar.

Prompt 7 — Power-ups

Implementa los power-ups en GameScene.js:

1. Los power-ups quedan en el suelo al destruirse un brick (aparecen con 20% probabilidad).
2. Hay dos tipos: 'powerup_fire' (aumenta rango de explosión en 1) y 'powerup_bomb'
   (aumenta el número máximo de bombas simultáneas en 1).
3. Cuando el jugador pisa un power-up, lo recoge (desaparece) y aplica el efecto.
4. El rango máximo es 6 y el máximo de bombas es 8.
5. Muestra brevemente un texto flotante encima del jugador indicando qué power-up recogió
   ("+FUEGO" o "+BOMBA"), que sube y desaparece en 1 segundo.

Prompt 8 — UI y puntuación

Implementa UIScene.js que se ejecuta en paralelo con GameScene:

1. Muestra en la parte superior (barra de 48px de alto, fondo oscuro semitransparente):
   - Puntuación actual: "SCORE: 0" a la izquierda
   - Vidas del jugador como iconos (corazones o sprites del player pequeños) en el centro
   - Tiempo transcurrido "TIME: 0:00" a la derecha
2. La puntuación y las vidas se actualizan recibiendo eventos de GameScene
   mediante this.scene.get('GameScene').events.on(...)
3. Cuando el tiempo llega a 3:00 minutos, todos los bricks desaparecen y los enemigos
   se vuelven el doble de rápidos.
4. Crea también una pantalla de Game Over y una de Victoria con:
   - Puntuación final
   - Botón o tecla para reiniciar (recarga la GameScene)

Prompt 9 — Ajustes finales y pulido
Revisa y mejora el juego completo con los siguientes ajustes:

1. Añade un efecto de parpadeo al jugador cuando pierde una vida (tween de alpha durante 2s),
   durante ese tiempo el jugador es invulnerable.
2. Añade un efecto de sacudida de cámara (camera shake) al explotar una bomba.
3. Asegúrate de que el canvas se escala correctamente en pantallas pequeñas:
   usa Phaser Scale Manager con mode: Phaser.Scale.FIT y autoCenter.
4. Añade una pantalla de inicio (MenuScene) antes de GameScene con:
   - Título "BOMBERMAN" centrado con estilo retro
   - Texto "Pulsa ENTER para jugar"
   - Instrucciones de controles (flechas/WASD para mover, SPACE para bomba)
5. Añade transiciones suaves entre escenas usando camera fadeIn/fadeOut.
6. Verifica que no haya memory leaks: destruye correctamente grupos, timers y eventos
   al cambiar de escena.