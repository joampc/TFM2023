import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { RecipeService } from '../recipe.service';
import { MatAutocomplete, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Observable, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, exhaustMap, filter, scan, startWith, switchMap, takeWhile, tap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import {  map } from 'rxjs/operators';
import { takeWhileInclusive } from 'rxjs-take-while-inclusive';
import { IngredientService } from '../ingredient.service';
import { ProjectInfoComponent } from '../project-info/project-info.component';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';

import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SettingsService } from '../settings.service';
import {TooltipPosition} from '@angular/material/tooltip';






   

@Component({
  selector: 'app-recipe-generator',
  templateUrl: './recipe-generator.component.html',
  styleUrls: ['./recipe-generator.component.css'],
})
export class RecipeGeneratorComponent implements OnInit {

  @ViewChild('chipSet') chipSet: ElementRef | undefined;
  useMarianModel: boolean = false;


// Define las traducciones para las etiquetas y textos
translations = {
  en: {
    selectIngredients: 'Select Ingredients',
    selectTemperature: 'Select Temperature:',
    submitButton: 'Generate Recipe',
    ingredients: 'Ingredients:',
    steps: 'Instructions:'
  },
  es: {
    selectIngredients: 'Seleccionar ingredientes',
    selectTemperature: 'Seleccionar temperatura:',
    submitButton: 'Generar receta',
    ingredients: 'Ingredientes:',
    steps: 'Instrucciones:'

  },
};




  recipeForm: FormGroup;
  selectedIngredients: { name: string; spanishName: string; selected: boolean }[] = [];
 
  selectedIngredientNames: string[] = [];
  translatedSteps: string[] = []; 

  filteredIngredientList: any[] = [];
  
  temperatureOptions: number[] = [0.2, 0.4, 0.8, 1.0];
  generatedRecipe: string = '';
  isLoading: boolean = false;
  recipeGenerated: boolean = false;
  recipetemperature: number = 0;
  time : string= '';
  level : string= '';


 
  constructor(private formBuilder: FormBuilder,
              private recipeService: RecipeService,
              private ingredientService: IngredientService,
              public dialog: MatDialog,
              private settingsService: SettingsService
              ) 
              {
    this.recipeForm = this.formBuilder.group({
      selectedIngredients: [''],
      temperature: [0.8, Validators.required],
      isSpanishMode: [false],
    });
   // this.selectedIngredients = this.ingredientService.selectedIngredients;
  }

  ngOnInit(): void {
    this.settingsService.getUseMarianModel().subscribe(useMarianModel => {
      this.useMarianModel = useMarianModel;
    });
    this.ingredientService.selectedIngredients$.subscribe(ingredients => {
      this.selectedIngredients = ingredients;
    });

    
  }
  

  clearChips() {
    this.selectedIngredients = [];
    this.ingredientService.clearIngredients;
  }

  
  generateRecipe() {
    this.recipeGenerated = false;
    this.generatedRecipe = '';
    const isSpanishMode = this.recipeForm.get('isSpanishMode')?.value;
    if (this.recipeForm.valid && this.selectedIngredients.length > 0) {
      const formData = this.recipeForm.value;
      const temperature = formData.temperature;
      this.isLoading = true;

      const selectedIngredientNames = this.selectedIngredients
        .filter((ingredient) => ingredient.selected)
        .map((ingredient) => ingredient.name);

      const recipeData = {
        ingredients: selectedIngredientNames,
        temperature: temperature,
        num_generate: 1000,
      };

      // Llamamos al método para generar la receta con los ingredientes y temperatura seleccionados
      this.recipeService.generateRecipe(recipeData).subscribe(
        (data) => {
          this.generatedRecipe = data.recipe;
          this.isLoading = false;
          this.recipeGenerated = true;
          this.recipetemperature = data.temperature;
          if (isSpanishMode) {
            if (!this.useMarianModel)
            {this.getTranslatedStepsGoogle(this.generatedRecipe);}
            else
            {this.getTranslatedSteps(this.generatedRecipe);}
          }
        },
        (error) => {
          this.isLoading = false;
          console.error('An error occurred:', error);
        }
      );
      
    }
  }



  removeIngredient(ingredient: any): void {
     this.ingredientService.removeIngredient(ingredient);
     this.generatedRecipe = '';
    this.translatedSteps = [];
    this.recipeGenerated = false;


  }


  toggleLanguage() {
    this.clearChips();
    this.generatedRecipe = '';
    this.translatedSteps = [];
    this.ingredientService.clearIngredients();
    this.selectedIngredients = [];
    this.recipeGenerated = false;
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
    return backgroundColor;
  }

  onEnter(event: Event) {
    event.preventDefault();
    if (event instanceof KeyboardEvent) {
      // Realiza acciones adicionales si es un evento de teclado
    }
  }

 

  getRecipeSteps(generatedRecipe: string): { steps: string[], time: string, level: string } {
    const stepsStartIndex = generatedRecipe.indexOf('Steps:');
    if (stepsStartIndex !== -1) {
      const stepsText = generatedRecipe.substring(stepsStartIndex + 7);
      const endIndex = stepsText.indexOf('⌚');
      if (endIndex !== -1) {
        const stepsArray = stepsText.substring(0, endIndex).split('\n');
        const filteredSteps = stepsArray
          .filter((step) => step.trim() !== '')
          .map((step) => step.replace(/▪︎/g, '').trim());
  
        // Extrae el tiempo (⌚) y el nivel (⚖️) después de los pasos
        const timeIndex = endIndex + 1; // Índice donde comienza el tiempo
        const levelIndex = generatedRecipe.indexOf('⚖️', timeIndex); // Índice donde comienza el nivel
  
        const time = generatedRecipe.substring(timeIndex, levelIndex).trim();
        const level = generatedRecipe.substring(levelIndex + 2).trim(); // +2 para omitir '⚖️'
        this.time = time;
        
        this.level = level;
  
        return { steps: filteredSteps, time, level };
      }
    }
  
    // Si no se encuentran los pasos o el formato esperado, retorna valores vacíos
    return { steps: [], time: '', level: '' };
  }
  


  getTranslatedSteps(generatedRecipe: string): void {
    console.log('tranlationMarian')
    if (this.recipeForm.get('isSpanishMode')?.value) {
      //const stepsInEnglish: string[] = this.getRecipeSteps(generatedRecipe);
      const { steps, time, level } = this.getRecipeSteps(generatedRecipe);
      const translatedStepsObservables: Observable<string>[] = steps.map((step) =>
        this.recipeService.translateTextMarian(step).pipe(
          map((translationResponse: any) => translationResponse.trans)
        )
      );

      forkJoin(translatedStepsObservables).subscribe((translatedSteps: string[]) => {
        this.translatedSteps = translatedSteps;
      });
    }
  }


  getTranslatedStepsGoogle(generatedRecipe: string): void {
    console.log('tranlationGoogle')
    if (this.recipeForm.get('isSpanishMode')?.value) {
      //const stepsInEnglish: string[] = this.getRecipeSteps(generatedRecipe);
      const { steps, time, level } = this.getRecipeSteps(generatedRecipe);
      const translatedStepsObservables: Observable<string>[] = steps.map((step) =>
        this.recipeService.translateTextGoogle(step).pipe(
          map((translationResponse: any) => {
            // Verifica si la traducción fue exitosa
            if (translationResponse && translationResponse.trans) {
              return translationResponse.trans; // Utiliza la traducción si está disponible
            } else {
              return step; // Mantén el paso en inglés si no hay traducción
            }
          })

        )
      );

      forkJoin(translatedStepsObservables).subscribe((translatedSteps: string[]) => {
        console.log('pasos', translatedSteps )
        this.translatedSteps = translatedSteps;
      });
    }
  }



  getImagePath(): string {
    // Determina la imagen en función del tiempo
    if (this.time.includes('Más de 60')) {
      return 'assets/timer/hour.png';
    } else if (this.time.includes('Entre 30')) {
      return 'assets/timer/3quarter.png';
    } else if (this.time.includes('Menos de 30')) {
      return 'assets/timer/half.png';
    } else {
      // Si no se encuentra una coincidencia, devuelve una imagen predeterminada o muestra un mensaje de error
      return 'assets/timer/default.png';
    }
  }


  getTimerBadgeText(): string {
    if (this.time.includes('Más de 60')) {
      return '+ 60 min';
    } else if (this.time.includes('Entre 30')) {
      return '+ 30 min';
    } else if (this.time.includes('Menos de 30')) {
      return '- 30 min';
    } else {
      return 'Unknown time';
    }
  }
  getLevelBadgeText(): string {
    if (this.level.toLowerCase().includes('bajo')) {
      return 'LOW';
    } else if (this.level.toLowerCase().includes('medio')) {
      return 'MED';
    } else if (this.level.toLowerCase().includes('alto')) {
      return 'HIGH';
    } else {
      return 'Unknown Level';
    }
  }

  openDialog() {
   

    this.dialog.open(ProjectInfoComponent, {
      width: '600px', // Puedes ajustar el tamaño
    });
  }


  openSettingsDialog(): void {
    const dialogRef = this.dialog.open(SettingsDialogComponent, {
      width: '400px' // Tamaño del diálogo
    });



  }
  
}


