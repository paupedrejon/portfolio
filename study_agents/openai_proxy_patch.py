"""
Parche para ignorar el argumento `proxies` en el cliente OpenAI.

Algunas dependencias (p.ej. versiones antiguas de Chroma) pueden intentar
instanciar `OpenAI` con `proxies`, lo que falla en openai>=1.x. Este parche
elimina el argumento antes de llamar al constructor real.
"""

import openai
from openai import OpenAI as _OpenAI


class PatchedOpenAI(_OpenAI):
    def __init__(self, *args, **kwargs):
        # Eliminar parámetro incompatible
        kwargs.pop("proxies", None)
        super().__init__(*args, **kwargs)


# Aplicar parche global
openai.OpenAI = PatchedOpenAI


