# Problema del Cumpleaños - EPDS-1D-1C26 1°D - Grupo 3

Proyecto de trabajo en grupo para la cátedra de Estadística y Probabilidades para el Desarrollo de Software 1° D sobre el **Problema del Cumpleaños**.

Backend en Python (Flask) · Frontend HTML/CSS/JS · Deploy en Vercel.

---

## Estructura del proyecto

```
birthday-problem/
├── api/
│   └── index.py          ← API Flask (Python)
├── public/
│   ├── index.html        ← Página principal
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── requirements.txt      ← Dependencias Python
├── vercel.json           ← Configuración de Vercel
└── README.md
```

---

## Endpoints de la API

| Método | Ruta                  | Descripción                    |
| ------ | --------------------- | ------------------------------ |
| GET    | `/api/calcular?n=40`  | Probabilidad para n personas   |
| GET    | `/api/tabla?hasta=60` | Tabla completa hasta n         |
| GET    | `/api/curva`          | Puntos para graficar (n=2..80) |
| GET    | `/api/info`           | Umbrales y datos generales     |

---

---

## Variables de entorno

No se requieren variables de entorno para el funcionamiento básico.

---

## Autores - Grupo 3

Carolina I. Fuentes, Micaela Salinas, Fernando Gerez, Cristian Rodas y Miguel A. Escurra

---

## Créditos

Desarrollado con Flask, Chart.js y tipografía Crimson Pro.
