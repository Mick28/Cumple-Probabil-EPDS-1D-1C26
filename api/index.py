import random
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ── Semilla aleatoria fija para reproducibilidad ──────────────────
SEMILLA = 42
REPETICIONES = 1000  # N=1000 según criterio del trabajo


# ════════════════════════════════════════════════════════════════════
#  FUNCIONES DE SIMULACIÓN (criterio: estructura propuesta)
# ════════════════════════════════════════════════════════════════════

def cumples(k: int) -> list[int]:
    """
    Genera una lista de k cumpleaños aleatorios (días del 1 al 365).
    Cada elemento representa el día del año en que nace una persona.

    Parámetros:
        k : número de personas en el grupo

    Retorna:
        Lista de k enteros, cada uno en [1, 365]
    """
    return [random.randint(1, 365) for _ in range(k)]


def hay_coincidencia(cumples_lista: list[int]) -> bool:
    """
    Determina si al menos dos personas en el grupo comparten cumpleaños.
    Usa set() para detectar duplicados en O(n).

    Parámetros:
        cumples_lista : lista de días de cumpleaños

    Retorna:
        True si hay al menos una coincidencia, False si todos son distintos
    """
    return len(cumples_lista) != len(set(cumples_lista))


def proporcion_coincidencia(k: int, N: int = REPETICIONES) -> float:
    """
    Estima por simulación Monte Carlo la probabilidad de que al menos
    dos personas en un grupo de k compartan cumpleaños.

    Repite N veces:
      1. Genera un grupo de k cumpleaños aleatorios con cumples(k)
      2. Verifica si hay coincidencia con hay_coincidencia()
    Retorna la proporción de experimentos con coincidencia.

    Parámetros:
        k : número de personas en el grupo
        N : número de repeticiones (default 1000)

    Retorna:
        Proporción estimada (float entre 0 y 1)
    """
    coincidencias = sum(
        1 for _ in range(N)
        if hay_coincidencia(cumples(k))
    )
    return coincidencias / N


# ════════════════════════════════════════════════════════════════════
#  SOLUCIÓN TEÓRICA (para comparación)
# ════════════════════════════════════════════════════════════════════

def prob_teorica(k: int, dias: int = 365) -> float:
    """
    Calcula la probabilidad exacta usando la fórmula del complemento:
    P = 1 - (365 × 364 × … × (365-k+1)) / 365^k

    Parámetros:
        k    : número de personas
        dias : días del año (default 365)

    Retorna:
        Probabilidad teórica exacta
    """
    if k <= 1:
        return 0.0
    if k > dias:
        return 1.0
    p_todos_distintos = 1.0
    for i in range(k):
        p_todos_distintos *= (dias - i) / dias
    return 1.0 - p_todos_distintos


def umbral_teorico(objetivo: float = 0.5) -> int:
    """Número mínimo de personas para que P_teórica supere el objetivo."""
    k = 1
    while prob_teorica(k) < objetivo and k <= 365:
        k += 1
    return k


# ════════════════════════════════════════════════════════════════════
#  ENDPOINTS DE LA API
# ════════════════════════════════════════════════════════════════════

@app.route("/api/simulacion", methods=["GET"])
def simulacion():
    """
    Ejecuta la simulación Monte Carlo para k de 1 a 50 con N=1000.
    Devuelve lista de probabilidades simuladas Y teóricas para comparación.
    """
    try:
        k_max = int(request.args.get("k_max", 50))
        k_max = max(2, min(k_max, 50))
        N = int(request.args.get("N", REPETICIONES))
        N = max(100, min(N, 1000))
        seed = int(request.args.get("seed", SEMILLA))
    except (ValueError, TypeError):
        k_max, N, seed = 50, REPETICIONES, SEMILLA

    random.seed(seed)

    resultados = []
    for k in range(1, k_max + 1):
        p_sim = proporcion_coincidencia(k, N)
        p_teo = prob_teorica(k)
        resultados.append({
            "k": k,
            "p_simulada": round(p_sim, 4),
            "p_teorica":  round(p_teo, 4),
            "diferencia": round(abs(p_sim - p_teo), 4),
        })

    # Umbral: primer k donde la simulación supera 0.5
    umbral_sim = next(
        (r["k"] for r in resultados if r["p_simulada"] >= 0.5), None
    )

    return jsonify({
        "parametros": {"N": N, "k_max": k_max, "semilla": seed},
        "resultados": resultados,
        "umbral_simulado_50": umbral_sim,
        "umbral_teorico_50": umbral_teorico(0.50),
        "umbral_teorico_99": umbral_teorico(0.99),
    })


@app.route("/api/calcular", methods=["GET"])
def calcular():
    """Probabilidad teórica para un k dado (respuesta rápida para el slider)."""
    try:
        k = int(request.args.get("n", 40))
        k = max(1, min(k, 365))
    except (ValueError, TypeError):
        return jsonify({"error": "Parámetro n inválido"}), 400

    p = prob_teorica(k)
    return jsonify({
        "n": k,
        "probabilidad":     round(p, 6),
        "probabilidad_pct": round(p * 100, 4),
        "complemento":      round(1 - p, 6),
        "complemento_pct":  round((1 - p) * 100, 4),
    })


@app.route("/api/curva", methods=["GET"])
def curva():
    """Curva teórica completa de k=1 a 80 para el gráfico principal."""
    puntos = [
        {"n": k, "p": round(prob_teorica(k), 6)}
        for k in range(1, 81)
    ]
    return jsonify({"puntos": puntos})


@app.route("/api/info", methods=["GET"])
def info():
    """Metadatos generales del problema."""
    return jsonify({
        "descripcion": "Problema del Cumpleaños",
        "formula":     "P = 1 - (365! / ((365-k)! · 365^k))",
        "N_simulacion": REPETICIONES,
        "umbral_50":   umbral_teorico(0.50),
        "umbral_75":   umbral_teorico(0.75),
        "umbral_99":   umbral_teorico(0.99),
        "prob_40":     round(prob_teorica(40) * 100, 2),
    })


if __name__ == "__main__":
    app.run(debug=True)
