"""
Parche global para eliminar el argumento 'proxies' de todas las inicializaciones de OpenAI.

Este parche intercepta openai.OpenAI.__init__ y openai.AsyncOpenAI.__init__
para eliminar el argumento 'proxies' que no es compatible con openai>=1.x.
También parchea langchain_openai.ChatOpenAI para evitar que pase proxies.
También parchea httpx.Client para evitar que reciba proxies.
"""

import functools
import sys

# Parchear httpx.Client ANTES de que se importe openai
def patch_httpx_client():
    """Parchea httpx.Client para eliminar 'proxies'"""
    try:
        import httpx
        
        if not hasattr(httpx.Client, '_patched_proxies'):
            httpx.Client._original_init = httpx.Client.__init__
            
            @functools.wraps(httpx.Client._original_init)
            def patched_httpx_client_init(self, *args, **kwargs):
                # ELIMINAR proxies si está presente
                kwargs.pop('proxies', None)
                return httpx.Client._original_init(self, *args, **kwargs)
            
            httpx.Client.__init__ = patched_httpx_client_init
            httpx.Client._patched_proxies = True
            print("✅ Parche de httpx.Client aplicado (proxies eliminado)")
    except Exception as e:
        print(f"⚠️ Warning: No se pudo aplicar parche de httpx: {e}")

# Aplicar parche de httpx inmediatamente
try:
    patch_httpx_client()
except:
    pass

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
            # ELIMINAR proxies si está presente (OpenAI.__init__() no lo acepta)
            kwargs.pop('proxies', None)
            # Llamar al __init__ original
            return openai.OpenAI._original_init(self, *args, **kwargs)
        
        if hasattr(openai, 'AsyncOpenAI'):
            @functools.wraps(openai.AsyncOpenAI._original_init)
            def patched_async_openai_init(self, *args, **kwargs):
                # ELIMINAR proxies si está presente
                kwargs.pop('proxies', None)
                # Llamar al __init__ original
                return openai.AsyncOpenAI._original_init(self, *args, **kwargs)
            
            openai.AsyncOpenAI.__init__ = patched_async_openai_init
        
        # Aplicar los parches
        openai.OpenAI.__init__ = patched_openai_init
        
        # CRÍTICO: Parchear OpenAI.init() si existe (método de clase)
        # Este es el que está causando el error "OpenAI.init() got an unexpected keyword argument 'proxies'"
        if hasattr(openai.OpenAI, 'init') and not hasattr(openai.OpenAI, '_patched_init_method'):
            openai.OpenAI._original_init_method = openai.OpenAI.init
            
            # Crear un descriptor que intercepte todas las llamadas
            class PatchedOpenAIInitMethod:
                def __init__(self, original):
                    self._original = original
                
                def __get__(self, obj, objtype=None):
                    # Retornar una función que ELIMINE proxies
                    def wrapper(*args, **kwargs):
                        # ELIMINAR proxies si está presente (OpenAI.init() no lo acepta)
                        kwargs.pop('proxies', None)
                        # Intentar llamar al método original
                        if objtype is not None:
                            # Llamada como método de clase
                            return self._original(*args, **kwargs)
                        else:
                            # Llamada como método de instancia
                            return self._original(*args, **kwargs)
                    return wrapper
                
                def __call__(self, *args, **kwargs):
                    # ELIMINAR proxies si está presente
                    kwargs.pop('proxies', None)
                    return self._original(*args, **kwargs)
            
            openai.OpenAI.init = PatchedOpenAIInitMethod(openai.OpenAI._original_init_method)
            openai.OpenAI._patched_init_method = True
            print("✅ Parche de OpenAI.init() aplicado con descriptor (proxies eliminado)")
        
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
                        # ELIMINAR proxies si está presente
                        kwargs.pop('proxies', None)
                        return _client.Client._original_init(self, *args, **kwargs)
                    
                    _client.Client.__init__ = patched_client_init
                    _client.Client._patched_init = True
                
                # CRÍTICO: Parchear Client.init() que es un método de clase
                # Este es el que está causando el error "Client.init() got an unexpected keyword argument 'proxies'"
                # Usar un descriptor para interceptar TODAS las llamadas
                if hasattr(_client.Client, 'init') and not hasattr(_client.Client, '_patched_init_method'):
                    _client.Client._original_init_method = _client.Client.init
                    
                    # Crear un descriptor que intercepte todas las llamadas
                    class PatchedInitMethod:
                        def __init__(self, original):
                            self._original = original
                        
                        def __get__(self, obj, objtype=None):
                            # Retornar una función que ELIMINE proxies (no lo establezca a None)
                            def wrapper(*args, **kwargs):
                                # ELIMINAR proxies si está presente (Client.init() no lo acepta)
                                kwargs.pop('proxies', None)
                                # Intentar llamar al método original
                                if objtype is not None:
                                    # Llamada como método de clase
                                    return self._original(*args, **kwargs)
                                else:
                                    # Llamada como método de instancia
                                    return self._original(*args, **kwargs)
                            return wrapper
                        
                        def __call__(self, *args, **kwargs):
                            # ELIMINAR proxies si está presente
                            kwargs.pop('proxies', None)
                            return self._original(*args, **kwargs)
                    
                    _client.Client.init = PatchedInitMethod(_client.Client._original_init_method)
                    _client.Client._patched_init_method = True
                    print("✅ Parche de Client.init() aplicado con descriptor (proxies establecido a None)")
        except Exception as e:
            print(f"⚠️ Warning al parchear _client: {e}")
            import traceback
            traceback.print_exc()
        
        # CRÍTICO: Parchear _base_client.BaseClient.__init__ que es la clase base
        # Este es el que realmente está fallando según el traceback
        # IMPORTANTE: BaseClient.__init__() requiere 'proxies' como argumento obligatorio,
        # así que debemos pasarlo como None en lugar de eliminarlo
        try:
            from openai import _base_client
            
            if hasattr(_base_client, 'BaseClient') and not hasattr(_base_client.BaseClient, '_patched'):
                _base_client.BaseClient._original_init = _base_client.BaseClient.__init__
                
                @functools.wraps(_base_client.BaseClient._original_init)
                def patched_base_client_init(self, *args, **kwargs):
                    # ELIMINAR proxies antes de pasarlo a BaseClient
                    # BaseClient intenta pasarlo a SyncHttpxClientWrapper que no lo acepta
                    kwargs.pop('proxies', None)
                    return _base_client.BaseClient._original_init(self, *args, **kwargs)
                
                _base_client.BaseClient.__init__ = patched_base_client_init
                _base_client.BaseClient._patched = True
                print("✅ Parche de BaseClient aplicado (proxies eliminado)")
        except Exception as e:
            print(f"⚠️ Warning al parchear _base_client: {e}")
            import traceback
            traceback.print_exc()
        
        # CRÍTICO: Parchear SyncHttpxClientWrapper si existe
        # Este es el que está causando el error "Client.__init__() got an unexpected keyword argument 'proxies'"
        try:
            from openai import _base_client
            
            if hasattr(_base_client, 'SyncHttpxClientWrapper') and not hasattr(_base_client.SyncHttpxClientWrapper, '_patched'):
                _base_client.SyncHttpxClientWrapper._original_init = _base_client.SyncHttpxClientWrapper.__init__
                
                @functools.wraps(_base_client.SyncHttpxClientWrapper._original_init)
                def patched_sync_httpx_wrapper_init(self, *args, **kwargs):
                    # ELIMINAR proxies antes de pasarlo a httpx.Client
                    kwargs.pop('proxies', None)
                    return _base_client.SyncHttpxClientWrapper._original_init(self, *args, **kwargs)
                
                _base_client.SyncHttpxClientWrapper.__init__ = patched_sync_httpx_wrapper_init
                _base_client.SyncHttpxClientWrapper._patched = True
                print("✅ Parche de SyncHttpxClientWrapper aplicado (proxies eliminado)")
        except Exception as e:
            print(f"⚠️ Warning al parchear SyncHttpxClientWrapper: {e}")
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
                # ELIMINAR proxies si está presente
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
                            # ELIMINAR proxies si está presente
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
# Asegurar que httpx esté parcheado primero
try:
    patch_httpx_client()
except:
    pass

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
