import base64
import io
import json
import traceback

_LSFP_IMAGES = []
_LSFP_GLOBALS = {"__name__": "__main__"}
_LSFP_PALETTE = {}


def _lsfp_capture_figures():
    """Serialise every open matplotlib figure to a base64 PNG, then close it."""
    try:
        import matplotlib.pyplot as plt
    except ImportError:
        return
    for num in plt.get_fignums():
        fig = plt.figure(num)
        buf = io.BytesIO()
        fig.savefig(
            buf,
            format="png",
            dpi=140,
            bbox_inches="tight",
            facecolor=fig.get_facecolor(),
            edgecolor="none",
        )
        _LSFP_IMAGES.append(base64.b64encode(buf.getvalue()).decode("ascii"))
    plt.close("all")


def _lsfp_theme(palette_json):
    """Apply the site palette to matplotlib, if matplotlib is loaded.

    Called after every package load and whenever the page theme changes, so a
    figure always matches the page it is rendered into.
    """
    global _LSFP_PALETTE
    _LSFP_PALETTE = json.loads(palette_json)
    try:
        import matplotlib
    except ImportError:
        return

    matplotlib.use("AGG")
    import matplotlib.pyplot as plt
    from cycler import cycler

    p = _LSFP_PALETTE
    bg = p.get("background", "#ffffff")
    fg = p.get("foreground", "#0d1117")
    muted = p.get("muted", "#5b6b7c")
    border = p.get("border", "#e3e8ee")
    series = p.get("series") or ["#1a5fb4", "#c64600", "#2a7a4f", "#a0348a", "#8a6d00"]

    matplotlib.rcParams.update({
        "figure.figsize": (7.0, 4.0),
        "figure.dpi": 140,
        "figure.facecolor": bg,
        "figure.edgecolor": bg,
        "savefig.facecolor": bg,
        "savefig.edgecolor": bg,
        "axes.facecolor": bg,
        "axes.edgecolor": border,
        "axes.labelcolor": muted,
        "axes.titlecolor": fg,
        "axes.titlesize": 11,
        "axes.titleweight": "medium",
        "axes.labelsize": 9,
        "axes.grid": True,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.prop_cycle": cycler(color=series),
        "grid.color": border,
        "grid.linewidth": 0.8,
        "grid.alpha": 0.9,
        "text.color": fg,
        "xtick.color": muted,
        "ytick.color": muted,
        "xtick.labelsize": 8,
        "ytick.labelsize": 8,
        "legend.frameon": False,
        "legend.fontsize": 8.5,
        "font.size": 9.5,
        "lines.linewidth": 1.8,
        "patch.edgecolor": bg,
    })

    # Make plt.show() flush figures into the output stream instead of trying to
    # open a window that does not exist.
    if not getattr(plt, "_lsfp_patched", False):
        def _lsfp_show(*args, **kwargs):
            _lsfp_capture_figures()

        plt.show = _lsfp_show
        plt._lsfp_patched = True


async def _lsfp_run(code):
    from pyodide.code import eval_code_async

    _LSFP_IMAGES.clear()
    result = None
    error = None

    try:
        result = await eval_code_async(code, globals=_LSFP_GLOBALS)
    except BaseException as exc:  # noqa: BLE001 - user code may raise anything
        # tb_next drops this wrapper's own frame from the traceback.
        tb = exc.__traceback__.tb_next if exc.__traceback__ else None
        error = "".join(traceback.format_exception(type(exc), exc, tb))

    # Capture anything the learner drew but did not explicitly show().
    try:
        _lsfp_capture_figures()
    except BaseException:
        pass

    try:
        rendered = None if result is None else repr(result)
    except BaseException:
        rendered = "<unrepresentable object>"

    images = list(_LSFP_IMAGES)
    _LSFP_IMAGES.clear()
    return json.dumps({"repr": rendered, "error": error, "images": images})


def _lsfp_reset():
    _LSFP_GLOBALS.clear()
    _LSFP_GLOBALS["__name__"] = "__main__"
    _LSFP_IMAGES.clear()
    try:
        import matplotlib.pyplot as plt

        plt.close("all")
    except ImportError:
        pass
