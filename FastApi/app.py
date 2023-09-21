from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from transformers import MarianTokenizer, MarianMTModel
from googletrans import Translator


import numpy as np
import tensorflow as tf
import pickle
import json
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging



app = FastAPI()


# Configura CORS
origins = [
    "http://localhost",
    "http://localhost:4200",
    "https://tfm-recipe-generator.netlify.app",
    "https://tfm-recipe-generator.netlify.app/generator",  # Agrega la URL completa de la ruta
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Cargar el modelo y el tokenizador para la traducción de inglés a español
model_name = "Helsinki-NLP/opus-mt-en-es"
mariantokenizer = MarianTokenizer.from_pretrained(model_name)
translation_model = MarianMTModel.from_pretrained(model_name)

STOP_WORD = '␣'
STOP_WORD_TITLE = '📗 '
STOP_WORD_INGREDIENTS = '\n🥕\n\n'
STEP_WORD = '\n📝\n\n'
MAX_RECIPE_LENGTH = 1000

# Define las rutas a los archivos dentro del contenedor Docker
model_file_path = '/app/recipe_gen_model.h5'
tokenizer_file_path = '/app/tokenizer.pkl'
json_file_path = '/app/ingredient_translated.json'


def loss(labels, logits):
    entropy = tf.keras.losses.sparse_categorical_crossentropy(
      y_true=labels,
      y_pred=logits,
      from_logits=True
    )
    
    return entropy


# Registra la función de pérdida personalizada
custom_objects = {'loss': loss}  # Reemplaza 'loss' con el nombre real de tu función de pérdida si es diferente

# Carga el modelo utilizando el contexto custom_object_scope
with tf.keras.utils.custom_object_scope(custom_objects):
    loaded_model = tf.keras.models.load_model(model_file_path)

# Cargar el tokenizer desde el archivo incluido en la imagen
with open(tokenizer_file_path, 'rb') as f:
    loaded_tokenizer = pickle.load(f)

# Definir la arquitectura del modelo cargado
tokenizer = loaded_tokenizer
vocab_size = len(tokenizer.word_index) + 1  # Tamaño del vocabulario
embedding_dim = 256  # Dimensión de embedding
rnn_units = 1024  # Número de unidades LSTM

batch_size = 1
loaded_model = tf.keras.models.Sequential()
loaded_model.add(tf.keras.layers.Embedding(
    input_dim=vocab_size,
    output_dim=embedding_dim,
    batch_input_shape=[batch_size, None]
))
loaded_model.add(tf.keras.layers.LSTM(
    units=rnn_units,
    return_sequences=True,
    stateful=True,
    recurrent_initializer=tf.keras.initializers.GlorotNormal()
))
loaded_model.add(tf.keras.layers.Dropout(0.2))
loaded_model.add(tf.keras.layers.LSTM(
    units=rnn_units,
    return_sequences=True,
    stateful=True,
    recurrent_initializer=tf.keras.initializers.GlorotNormal()
))
loaded_model.add(tf.keras.layers.Dropout(0.2))
loaded_model.add(tf.keras.layers.Dense(vocab_size))

# Cargar los pesos del modelo preentrenado
loaded_model.load_weights('recipe_gen_model.h5')



class RecipeData(BaseModel):
    ingredients: List[str]
    temperature: Optional[float] = 0.8
    num_generate: Optional[int] = 1000


class RecipeResponse(BaseModel):
    ingredients: List[str]
    temperature: float
    recipe: str

class TranslationResponse(BaseModel):
    trans: str
    
class TranslationRequest(BaseModel):
    text: str    



def generate_recipe_with_ingredients(model, tokenizer, ingredients, num_generate=1000, temperature=1.0):
    # Create a prompt with the provided ingredients
    ingredients_list = "\n".join(["▪ " + ingredient for ingredient in ingredients])
    prompt = "Ingredients:\n" + ingredients_list + "\n\nSteps:\n"
    padded_prompt = STOP_WORD_TITLE + prompt
    
    # Converting our prompt to numbers (vectorizing).
    prompt_indices = np.array(tokenizer.texts_to_sequences([padded_prompt]))
    
    # Empty string to store our results.
    text_generated = []

    # Here batch size == 1.
    model.reset_states()
    for char_index in range(num_generate):
        predictions = model(prompt_indices)
        # Remove the batch dimension
        predictions = tf.squeeze(predictions, 0)

        # Using a categorical distribution to predict the character returned by the model.
        predictions = predictions / temperature
        predicted_id = tf.random.categorical(
            predictions,
            num_samples=1
        )[-1, 0].numpy()

        # We pass the predicted character as the next input to the model
        # along with the previous hidden state.
        prompt_indices = tf.expand_dims([predicted_id], 0)
        
        next_character = tokenizer.index_word[predicted_id]  # Convert index to character
        
        if next_character == STOP_WORD:
            break
        elif next_character == STEP_WORD:
            # Add the next ingredient to the steps if available
            if ingredients:
                ingredient = ingredients.pop(0)
                text_generated.append("\n▪︎ " + ingredient)
        else:
            text_generated.append(next_character)

    generated_text = ''.join(text_generated)
    formatted_text = generated_text.replace('\n\n', '\n').strip()
    
    return (padded_prompt + formatted_text)



@app.get("/")
def read_root():
    return {"Hello": "This is our TFM web service"}






@app.get("/api/get_ingredients")
async def get_available_ingredients(
    page: int = Query(1, description="Page number", ge=1),
    page_size: int = Query(10, description="Page size", ge=1),
    term: str = Query(None, description="Search term"),
    is_spanish_mode: bool = Query(False, description="Spanish mode flag")
):
    try:
        # Carga el archivo JSON con la frecuencia de ingredientes
        with open(json_file_path, 'r') as json_file:
            ingredient_data = json.load(json_file)

        # Filtra los ingredientes en función del término de búsqueda (si se proporciona)
        if term:
            if is_spanish_mode:
                ingredient_data = [item for item in ingredient_data if term.lower() in item["T_Marian"].lower()]
            else:
                ingredient_data = [item for item in ingredient_data if term.lower() in item["Ingrediente"].lower()]

        total_items = len(ingredient_data)  # Calcula el total de elementos

        # Obtiene la lista paginada de ingredientes
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        ingredientes_paginados = ingredient_data[start_idx:end_idx]

        return {"ingredientes": ingredientes_paginados, "total_items": total_items}  # Devuelve el total de elementos
    except Exception as e:
        # Maneja cualquier error que pueda ocurrir al leer el archivo JSON
        return {"error": str(e)}




# Ruta para generar una receta con ingredientes dados
@app.post("/api/generate-recipe", response_model=RecipeResponse)
async def generate_recipe(recipe: RecipeData):
    try:
      
        generated_recipe = generate_recipe_with_ingredients(loaded_model, tokenizer, recipe.ingredients, recipe.num_generate, recipe.temperature)
        return RecipeResponse(ingredients=recipe.ingredients, temperature=recipe.temperature, recipe=generated_recipe)
    except Exception as e:
        # Maneja cualquier error que pueda ocurrir al generar la receta
        return {"error": str(e)}
        


# Ruta para obtener todos los ingredientes disponibles
@app.get("/api/get_all_ingredients")
async def get_all_ingredients():
    try:
        # Carga el archivo JSON con la frecuencia de ingredientes
        with open(json_file_path, 'r') as json_file:
            ingredient_data = json.load(json_file)

        # Obtén la lista de ingredientes a partir de la estructura actual
        ingredientes_lista = [item["Ingrediente"] for item in ingredient_data]

        return {"ingredientes": ingredientes_lista}
    except Exception as e:
        # Maneja cualquier error que pueda ocurrir al leer el archivo JSON
        return {"error": str(e)}
        

# Método para generar una receta con ingredientes y traducirla al español
def generate_recipe_with_translation(model, tokenizer, ingredients, num_generate=1000, temperature=1.0):
    # Generar la receta en inglés
    english_recipe = generate_recipe_with_ingredients(model, tokenizer, ingredients, num_generate, temperature)
    
    # Traducir la receta al español
    inputs = mariantokenizer.encode("translate English to Spanish: " + english_recipe, return_tensors="pt")
    translation = translation_model.generate(inputs, max_length=2000, num_return_sequences=1)
    spanish_recipe = mariantokenizer.decode(translation[0], skip_special_tokens=True)
    
    return spanish_recipe

# Ruta para generar una receta con ingredientes dados y traducirla
@app.post("/api/generate-recipe-with-translation", response_model=RecipeResponse)
async def generate_recipe_with_translation_endpoint(recipe: RecipeData):
    try:
        generated_recipe = generate_recipe_with_translation(loaded_model, tokenizer, recipe.ingredients, recipe.num_generate, recipe.temperature)
        return RecipeResponse(ingredients=recipe.ingredients, temperature=recipe.temperature, recipe=generated_recipe)
    except Exception as e:
        # Registra el error
        logging.error(f"Error en generate_recipe_with_translation_endpoint: {str(e)}")
        return {"error": str(e)}


# Ruta para traducir texto con el modelo Marian
@app.post("/api/Mtranslate", response_model=TranslationResponse)
async def translate_textMarian(request: TranslationRequest):
    try:
       # Tokeniza el texto de entrada
        input_ids = mariantokenizer.encode(request.text, return_tensors="pt")

        # Realiza la traducción
        translated_ids = translation_model.generate(input_ids, max_length=2000, num_return_sequences=1)
        
        # Decodifica la traducción
        translated_text = mariantokenizer.decode(translated_ids[0], skip_special_tokens=True)
        return {"trans": translated_text}
    except Exception as e:
        # Registra el error
        logging.error(f"Error en translate_textMarian: {str(e)}")
        return {"trans": f"Error: {str(e)}"}  # Devuelve "trans" incluso en caso de error



        


# Ruta para traducir texto con Google_translate
@app.post("/api/Gtranslate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    translator = Translator()
    try:
        # Traduce el texto utilizando Google Translate
        translation = translator.translate(request.text, "es")
        translated_text = translation.text
        return {"trans": translated_text}
    except Exception as e:
        # Registra el error
        logging.error(f"Error en translate_text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))