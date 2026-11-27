# 🧠 Thoth - Laboratorio Interactivo de Algoritmos

> *"En honor a Thoth, dios egipcio de la sabiduría, las matemáticas y el conocimiento"*

Una aplicación web moderna e interactiva para visualizar y experimentar con algoritmos heurísticos de optimización y búsqueda.

![Thoth](https://img.shields.io/badge/Estado-Activo-success)
![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ Características

- **🎯 A* Pathfinding**: Visualiza el algoritmo A* encontrando el camino más corto en un grid interactivo
- **⛰️ Hill Climbing**: Observa cómo este algoritmo de búsqueda local encuentra máximos en funciones matemáticas
- **🔥 Simulated Annealing**: Experimenta con optimización probabilística inspirada en el recocido metalúrgico
- **🧬 Algoritmos Genéticos**: Observa la evolución de poblaciones mediante selección, cruce y mutación
- **🎨 Diseño Moderno**: Interfaz premium con glassmorphism, gradientes y animaciones suaves
- **⚡ Totalmente Interactivo**: Controla parámetros en tiempo real y observa los resultados

## 🚀 Inicio Rápido

### Opción 1: Abrir directamente
Simplemente abre el archivo `index.html` en tu navegador favorito.

### Opción 2: Servidor local
```bash
# Con Python
python -m http.server 8080

# Con Node.js
npx http-server -p 8080

# Con PHP
php -S localhost:8080
```

Luego visita `http://localhost:8080` en tu navegador.

## 📚 Algoritmos Implementados

### A* (A-Star) Pathfinding
Algoritmo de búsqueda de caminos que utiliza heurística para encontrar el camino más corto entre dos puntos.

**Características:**
- Grid interactivo de tamaño configurable (10x10 a 40x40)
- Coloca obstáculos haciendo clic
- Arrastra los puntos de inicio y final
- Visualización animada del proceso de búsqueda
- Estadísticas en tiempo real (nodos visitados, longitud del camino, tiempo)

**Heurística utilizada:** Distancia Manhattan

### Hill Climbing
Algoritmo de optimización que siempre se mueve hacia la mejor solución vecina.

**Características:**
- Múltiples funciones de prueba (cuadrática, seno, Rastrigin)
- Tamaño de paso configurable
- Visualización del recorrido de optimización
- Puede quedar atrapado en máximos locales (¡inténtalo con Rastrigin!)


### Simulated Annealing
Algoritmo probabilístico que acepta soluciones peores con cierta probabilidad que disminuye con el tiempo.

**Características:**
- Temperatura inicial configurable
- Tasa de enfriamiento ajustable
- Visualización de la temperatura en tiempo real
- Puede escapar de máximos locales
- Contador de aceptaciones de soluciones

### Algoritmos Genéticos
Técnica de optimización inspirada en la evolución biológica que utiliza selección, cruce y mutación.

**Características:**
- Tamaño de población configurable (20-200 individuos)
- Tasa de mutación ajustable (0.01-0.5)
- Tasa de crossover configurable (0.5-1.0)
- Visualización de la evolución generación por generación
- Selección por torneo para elegir los mejores individuos
- Crossover aritmético para combinar características
- Mutación gaussiana para exploración
- Elitismo: el mejor individuo siempre sobrevive
- Estadísticas en tiempo real (mejor fitness, fitness promedio)

## 🎮 Cómo Usar

### A* Pathfinding
1. Haz clic en el grid para colocar obstáculos (paredes negras)
2. Arrastra el punto verde (inicio) o rojo (final) a nuevas posiciones
3. Ajusta el tamaño del grid y la velocidad de animación
4. Presiona **"Ejecutar A*"** para ver el algoritmo en acción
5. Observa cómo se expanden los nodos visitados (azul claro) hasta encontrar el camino (azul oscuro)

### Hill Climbing
1. Selecciona una función a optimizar
2. Ajusta el tamaño de paso (valores más pequeños = búsqueda más precisa)
3. Configura el número máximo de iteraciones
4. Presiona **"Ejecutar Hill Climbing"**
5. Observa cómo el algoritmo asciende hacia el máximo local más cercano

### Simulated Annealing
1. Selecciona una función a optimizar
2. Configura la temperatura inicial (mayor = más exploración)
3. Ajusta la tasa de enfriamiento (valores cercanos a 1 = enfriamiento lento)
4. Presiona **"Ejecutar Simulated Annealing"**
5. Observa la barra de temperatura y cómo el algoritmo explora el espacio de búsqueda

### Algoritmos Genéticos
1. Selecciona una función a optimizar
2. Ajusta el tamaño de población (más individuos = mayor diversidad)
3. Configura la tasa de mutación (mayor = más exploración aleatoria)
4. Ajusta la tasa de crossover (mayor = más mezcla de características)
5. Establece el número de generaciones
6. Presiona **"Ejecutar Algoritmo Genético"**
7. Observa cómo la población evoluciona, con puntos verdes representando individuos y el punto rojo el mejor

## 🛠️ Tecnologías

- **HTML5 Canvas**: Para renderizado de gráficos de alto rendimiento
- **Vanilla CSS**: Sistema de diseño moderno con variables CSS
- **Vanilla JavaScript**: Sin dependencias externas, código limpio y eficiente
- **Google Fonts**: Tipografía Inter y JetBrains Mono

## 📁 Estructura del Proyecto

```
Thoth/
├── index.html          # Estructura HTML principal
├── styles.css          # Sistema de diseño y estilos
├── js/
│   ├── core.js         # Base común: canvas, ejecución cancelable y utilidades
│   ├── search.js       # Búsqueda lineal y binaria
│   ├── sorting.js      # Burbuja, selección, inserción, mezcla y rápido
│   ├── heuristics.js   # A*, Hill Climbing y Recocido Simulado
│   ├── evolutionary.js # Algoritmo genético y PSO
│   ├── ml.js           # K-means
│   └── app.js          # Pestañas, pseudocódigo, acertijos y arranque
└── README.md           # Este archivo
```

## 🎨 Diseño

El proyecto utiliza un sistema de diseño moderno con:
- **Glassmorphism**: Paneles con efecto de vidrio esmerilado
- **Gradientes vibrantes**: Paleta de colores púrpura, azul y verde
- **Animaciones suaves**: Transiciones y efectos hover
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Modo oscuro**: Diseño optimizado para reducir fatiga visual

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si tienes ideas para mejorar el proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

### Ideas para contribuir
- Agregar más algoritmos heurísticos (Ant Colony, Particle Swarm, Tabu Search, etc.)
- Implementar más funciones de prueba
- Mejorar la visualización con gráficos 3D
- Agregar modo de comparación entre algoritmos
- Exportar resultados a CSV/JSON

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

Desarrollado con asistencia de IA como herramienta educativa para visualizar y comprender algoritmos heurísticos.

## 📧 Contacto

Si tienes preguntas o sugerencias, no dudes en abrir un issue en el repositorio.

---

**¡Disfruta explorando los algoritmos heurísticos!** 🚀

<!-- Trigger deployment -->

