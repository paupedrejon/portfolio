"""
Parche global para eliminar el argumento 'proxies' de todas las inicializaciones de OpenAI.

Este parche intercepta openai.OpenAI.__init__ y openai.AsyncOpenAI.__init__
para eliminar el argumento 'proxies' que no es compatible con openai>=1.x.
También parchea langchain_openai.ChatOpenAI para evitar que pase proxies.
"""

import functools
import sys

# Aplicar el parche ANTES de que cualquier cosa importe openai
def patch_openai_client():
    """Parchea openai.OpenAI y openai.AsyncOpenAI para eliminar 'proxies'"""
    try:
        import openai
        
        # Guardar las funciones originales solo una vez
        if not hasattr(openai.OpenAI, '_original_init'):
            openai.OpenAI._original_init = openai.OpenAI.__init__
            if hasattr(openai, 'AsyncOpenAI'):
                openai.AsyncOpenAI._original_init = openai.AsyncOpenAI.__init__
        
        @functools.wraps(openai.OpenAI._original_init)
        def patched_openai_init(self, *args, **kwargs):
            # Eliminar 'proxies' si está presente
            kwargs.pop('proxies', None)
            # También eliminar cualquier referencia a proxies en args
            # Llamar al __init__ original
            return openai.OpenAI._original_init(self, *args, **kwargs)
        
        if hasattr(openai, 'AsyncOpenAI'):
            @functools.wraps(openai.AsyncOpenAI._original_init)
            def patched_async_openai_init(self, *args, **kwargs):
                # Eliminar 'proxies' si está presente
                kwargs.pop('proxies', None)
                # Llamar al __init__ original
                return openai.AsyncOpenAI._original_init(self, *args, **kwargs)
            
            openai.AsyncOpenAI.__init__ = patched_async_openai_init
        
        # Aplicar los parches
        openai.OpenAI.__init__ = patched_openai_init
        
        # También parchear el módulo _client si existe (donde se crea el cliente internamente)
        try:
            from openai import _client
            
            # Parchear OpenAI en _client
            if hasattr(_client, 'OpenAI') and not hasattr(_client.OpenAI, '_patched'):
                _client.OpenAI._original_init = _client.OpenAI.__init__
                _client.OpenAI.__init__ = patched_openai_init
                _client.OpenAI._patched = True
            
            # Parchear Client si existe (usado internamente por OpenAI)
            if hasattr(_client, 'Client'):
                # Parchear Client.__init__ si existe
                if hasattr(_client.Client, '__init__') and not hasattr(_client.Client, '_patched_init'):
                    _client.Client._original_init = _client.Client.__init__
                    
                    @functools.wraps(_client.Client._original_init)
                    def patched_client_init(self, *args, **kwargs):
                        kwargs.pop('proxies', None)
                        return _client.Client._original_init(self, *args, **kwargs)
                    
                    _client.Client.__init__ = patched_client_init
                    _client.Client._patched_init = True
                
                # También parchear Client.init() si es un método de clase
                if hasattr(_client.Client, 'init') and not hasattr(_client.Client, '_patched_init_method'):
                    _client.Client._original_init_method = _client.Client.init
                    
                    @functools.wraps(_client.Client._original_init_method)
                    def patched_client_init_method(*args, **kwargs):
                        kwargs.pop('proxies', None)
                        return _client.Client._original_init_method(*args, **kwargs)
                    
                    _client.Client.init = patched_client_init_method
                    _client.Client._patched_init_method = True
        except Exception as e:
            print(f"⚠️ Warning al parchear _client: {e}")
            import traceback
            traceback.print_exc()
        
        print("✅ Parche de OpenAI aplicado (proxies eliminado)")
    except Exception as e:
        print(f"⚠️ Warning: No se pudo aplicar parche de OpenAI: {e}")
        import traceback
        traceback.print_exc()

def patch_langchain_openai():
    """Parchea langchain_openai.ChatOpenAI para evitar que pase proxies"""
    try:
        from langchain_openai import ChatOpenAI
        
        if not hasattr(ChatOpenAI, '_patched'):
            ChatOpenAI._original_init = ChatOpenAI.__init__
            
            @functools.wraps(ChatOpenAI._original_init)
            def patched_chatopenai_init(self, *args, **kwargs):
                # Eliminar 'proxies' si está presente
                kwargs.pop('proxies', None)
                
                # También parchear el cliente interno ANTES de inicializar
                # LangChain puede crear el cliente internamente y pasar proxies
                try:
                    import openai
                    # Asegurar que el parche de OpenAI esté aplicado
                    if not hasattr(openai.OpenAI, '_original_init'):
                        patch_openai_client()
                except:
                    pass
                
                # Llamar al __init__ original
                result = ChatOpenAI._original_init(self, *args, **kwargs)
                
                return result
            
            ChatOpenAI.__init__ = patched_chatopenai_init
            ChatOpenAI._patched = True
            
            # También parchear el módulo _client de OpenAI si LangChain lo usa
            try:
                import openai
                # Intentar parchear _client.Client si existe
                if hasattr(openai, '_client'):
                    from openai import _client
                    if hasattr(_client, 'Client') and not hasattr(_client.Client, '_patched'):
                        _client.Client._original_init = _client.Client.__init__
                        
                        @functools.wraps(_client.Client._original_init)
                        def patched_client_init(self, *args, **kwargs):
                            kwargs.pop('proxies', None)
                            return _client.Client._original_init(self, *args, **kwargs)
                        
                        _client.Client.__init__ = patched_client_init
                        _client.Client._patched = True
            except:
                pass
            
            print("✅ Parche de ChatOpenAI aplicado (proxies eliminado)")
    except Exception as e:
        print(f"⚠️ Warning: No se pudo aplicar parche de ChatOpenAI: {e}")
        import traceback
        traceback.print_exc()

# Aplicar parches inmediatamente
patch_openai_client()

# Intentar parchear LangChain ahora (puede que aún no esté importado)
try:
    patch_langchain_openai()
except:
    # Si falla, se aplicará más tarde cuando se importe
    pass

# Monitorear si langchain_openai ya está importado
# Si es así, aplicar el parche inmediatamente
if 'langchain_openai' in sys.modules:
    try:
        patch_langchain_openai()
    except:
        pass
