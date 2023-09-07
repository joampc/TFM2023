import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RecipeService } from '../recipe.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { IngredientResponse } from '../ingredient-response.model'; // Ajusta la ruta según la ubicación real
import { FormControl } from '@angular/forms';
import {MatChipInputEvent, MatChipsModule} from '@angular/material/chips';






@Component({
  selector: 'app-recipe-generator',
  templateUrl: './recipe-generator.component.html',
  styleUrls: ['./recipe-generator.component.css'],
})
export class RecipeGeneratorComponent implements OnInit {
  recipeForm: FormGroup;
   ingredients: string[] = [];
   addOnBlur = true;
   
  
  isLoading: boolean = false;
  selectedIngredients: string[] = [];
  temperatureOptions: number[] = [0.2,0.4, 0.8, 1.0];
  generatedRecipe: string = '';

   formControl = new FormControl(['angular']);
    // Propiedades para el campo de búsqueda y autocompletado
    ingredientCtrl = new FormControl();
    filteredIngredients: Observable<string[]> = new Observable<string[]>(); // Inicialización vacía
    allIngredients: string[] = []; // Todas las opciones de ingredientes

  constructor(
    private formBuilder: FormBuilder,
    private recipeService: RecipeService
  ) {
    this.recipeForm = this.formBuilder.group({
      //selectedIngredients: ['', Validators.required],
      selectedIngredients: [''],
      temperature: [0.8, Validators.required],
    });
  }

  ngOnInit() {
    // Llamamos al método para obtener la lista de ingredientes disponibles
    this.getAvailableIngredients();
    // Configurar el filtro para el campo de búsqueda
    this.filteredIngredients = this.ingredientCtrl.valueChanges.pipe(
    startWith(''),
    map((value) => this._filterIngredients(value))
);
  }


  private _filterIngredients(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allIngredients.filter((ingredient) =>
      ingredient.toLowerCase().includes(filterValue)
    );
  }

displayIngredient(ingredient: string): string {
  return ingredient; // Puedes personalizar cómo se muestra cada ingrediente si es necesario
}

// Método para manejar la selección de un ingrediente del autocompletado
onIngredientSelected(event: MatAutocompleteSelectedEvent): void {
  const selectedIngredient = event.option.viewValue;

  // Verificar si el ingrediente ya está en la lista de seleccionados
  if (!this.selectedIngredients.includes(selectedIngredient)) {
    this.selectedIngredients.push(selectedIngredient);
  }

  // Limpiar el campo de búsqueda
  this.ingredientCtrl.setValue('');
}


  getAvailableIngredients() {
    const pageSize = 200;
    this.recipeService.getIngredients(pageSize).subscribe(
      (data: IngredientResponse) => {
        // Extrae la lista de ingredientes del objeto IngredientResponse
        this.ingredients = data.ingredientes;
        this.allIngredients = data.ingredientes; // Asigna la lista de ingredientes para el filtro
      },
      (error) => {
        console.error('An error occurred:', error);
      }
    );
  }
  

  generateRecipe() {
    this.generatedRecipe = ''; // Limpia la receta generada
    if (this.recipeForm.valid && this.selectedIngredients.length > 0) {
      const formData = this.recipeForm.value;
      const temperature = formData.temperature;
      this.isLoading = true;
  
      const recipeData = {
        ingredients: this.selectedIngredients,
        temperature: temperature,
        num_generate: 1000,
      };
  
      // Llamamos al método para generar la receta con los ingredientes y temperatura seleccionados
      this.recipeService.generateRecipe(recipeData).subscribe(
        (data) => {
          this.generatedRecipe = data.recipe;
          this.isLoading = false; // Establece isLoading en false cuando la solicitud se completa
        
        },
        (error) => {
          // Manejar errores aquí si es necesario
          this.isLoading = false; // Asegurarse de que isLoading se establezca en false en caso de error
          console.error('An error occurred:', error);
        }
      );
    }
  }
  
  
  removeIngredient(ingredient: string): void {
    const index = this.selectedIngredients.indexOf(ingredient);
    if (index !== -1) {
      this.selectedIngredients.splice(index, 1);
    }
  }
  


  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our keyword
    if (value) {
      this.selectedIngredients.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();
  }




  getTemperatureColor(temperature: number): string {
    
     let backgroundColor: string;
    if (temperature === 0.2) {
      backgroundColor = '#FFECB3';
    } else if (temperature === 0.4) {
      backgroundColor = '#FFD54F';
    } else if (temperature === 0.8) {
      backgroundColor = '#FFC107';
    } else {
      backgroundColor = '#FF8F00';
    }
    return backgroundColor ;
  }
  onEnter(event: Event) {
    event.preventDefault();
    if (event instanceof KeyboardEvent) {
      // Realiza acciones adicionales si es un evento de teclado
    }
  }

  getRecipeSteps(generatedRecipe: string): string[] {
    const stepsStartIndex = generatedRecipe.indexOf('Steps:');
    if (stepsStartIndex !== -1) {
      // Si se encuentra el encabezado "Steps:", tomar los pasos a partir de ese punto
      const stepsText = generatedRecipe.substring(stepsStartIndex + 7); // Suma 7 para omitir "Steps:"
      // Dividir el texto de los pasos en líneas
      const stepsArray = stepsText.split('\n');
      // Eliminar líneas vacías o que contengan solo espacios
      const filteredSteps = stepsArray
      .filter((step) => step.trim() !== '')
      .map((step) => step.replace(/▪︎/g, '').trim()); // Reemplazar los bullets y espacios adicionales
    return filteredSteps;
    } else {
      // Si no se encuentra "Steps:", devolver un array vacío o manejarlo según sea necesario
      return [];
    }
  }
  
}
