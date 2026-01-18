# Runner Game - Phaser 3 + TypeScript

Игра-раннер на Phaser 3 с TypeScript и Vite.

## Быстрый старт

```bash
# Установка зависимостей
npm install --include=dev

# Запуск dev сервера с hot reload
npm run dev

# Сборка для production
npm run build

# Просмотр production сборки
npm run preview
```

## Структура проекта

```
playAble/
├── assets/              # Игровые ассеты (картинки, звуки)
├── src/                 # Исходный код TypeScript
│   ├── types.ts         # Типы и интерфейсы
│   ├── store.ts         # Управление состоянием игры
│   ├── player.ts        # Логика игрока
│   ├── enemy.ts         # Логика врагов
│   ├── objects.ts       # Монеты и препятствия
│   ├── main.ts          # Главный файл игры
│   └── styles.css       # Стили UI
├── index.html           # HTML шаблон
├── map.json             # Tiled карта уровня
├── package.json         # NPM зависимости
├── tsconfig.json        # Конфигурация TypeScript
└── vite.config.ts       # Конфигурация Vite
```

## Игровая механика

### Управление
- **Клик/тап** или **пробел/стрелка вверх** - прыжок

### Цели
- Собирать монеты (+10 очков)
- Избегать врагов и конусов
- Добраться до финиша

### Жизни
- Начальные жизни: 3
- При столкновении: -1 жизнь
- При 0 жизней: game over

## Технологии

- **Phaser 3** - игровой движок
- **TypeScript** - типизация
- **Vite** - сборка и dev сервер
