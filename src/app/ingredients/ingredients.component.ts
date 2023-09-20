import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { IngredientService } from '../ingredient.service';
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, MonoTypeOperatorFunction, Observable, Subject, catchError, combineLatest, concatMap, debounceTime, delay, distinctUntilChanged, exhaustMap, filter, map, mergeMap, of, scan, startWith, switchMap, take, takeWhile, tap } from 'rxjs';
import { takeWhileInclusive } from 'rxjs-take-while-inclusive';
import { RecipeService } from '../recipe.service';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { ThisReceiver } from '@angular/compiler';
import { SettingsService } from '../settings.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';







export interface ILookup {
  Ingrediente: string;
  Frecuencia: number;
    Lematizado: string;
    T_Marian: string;
    selected: boolean;
}



@Component({
  selector: 'app-ingredients',
  templateUrl: './ingredients.component.html',
  styleUrls: ['./ingredients.component.css'],
})
export class IngredientsComponent implements OnInit {
  @ViewChild(MatAutocompleteTrigger)
  autocompleteTrigger!: MatAutocompleteTrigger;
  @ViewChild('auto') autocomplete: ElementRef | undefined;

  @Input() isSpanishMode: boolean= false; // Define la propiedad de entrada

  ingredientes: any[] = [];

  constructor(private ingredientService: IngredientService, 
              private recipeService: RecipeService,
              private settingsService: SettingsService,
              private snackBar: MatSnackBar) {}

  translations = {
    en: {
      selectIngredients: 'Select Ingredients(max 4)',
      
    },
    es: {
      selectIngredients: 'Seleccionar ingredientes(max 4)',
 
    },
  };

  filteredLookups$: Observable<{ ingredientes: any[]; }> | undefined ;
  lookups: ILookup[] = [];
  private nextPage$ = new Subject();
  private _onDestroy = new Subject();
  searchText = new FormControl()
  currentPage = 1;
  pageSize = 30;

  totalItems: number | undefined;
  finalPage: number | undefined;

  allIngredients: any[] = []; // Almacena todos los ingredientes de todas las páginas
  orderAlphabetically: boolean | undefined;

  private settingsSubscription: Subscription | undefined;

  

  ngOnInit() {
 
    const filter$ = this.searchText.valueChanges.pipe(
      startWith(''),
      debounceTime(200),
      distinctUntilChanged(),
      filter((q) => typeof q === 'string')
    );
  
    filter$.subscribe((filter) => {
    });
  

    this.filteredLookups$ = filter$.pipe(
      switchMap((filter) => {
        let currentPage = 1;
        return this.nextPage$.pipe(
          startWith(currentPage),
          switchMap((_) =>
            this.recipeService.getIngredients(
              currentPage,
              this.pageSize,
              filter,
              this.isSpanishMode
            )
          ),
          tap((data) => {
            currentPage++;
            this.totalItems = data.total_items;
            if (this.totalItems !== undefined) {
              this.finalPage = Math.ceil(this.totalItems / this.pageSize);
            }
          }),
          scan((acc, data) => [...acc, ...data.ingredientes], [] as any[]),
          startWith([]),
          // map((ingredientes) => ({ ingredientes }))
          map((ingredientes) => {
            const newIngredients = ingredientes.filter(ing => !this.allIngredients.includes(ing));
            this.allIngredients = [...this.allIngredients, ...newIngredients];
            //
            return { ingredientes: newIngredients };
          })
        );
      })
    );

   
  }






  displayWith(lookup: ILookup): string {
    return lookup ? lookup.Ingrediente : '';
  }
  
  onScroll() {

    if (this.totalItems != undefined && this.currentPage * this.pageSize < this.totalItems) {
    //   if (this.finalPage!== undefined && this.currentPage < this.finalPage) {  
      this.nextPage$.next(this.currentPage);
    }
  
    // Abre el panel de autocompletar
    this.autocompleteTrigger.openPanel();
  }
  
  
  ngOnDestroy() {
    this.nextPage$.complete();
  }




addSelectedIngredient(event: MatAutocompleteSelectedEvent): void {
  const selectedIngredientName = event.option.viewValue;
  const selectedIngredient = this.allIngredients.find((ingredient) =>
    this.isSpanishMode
      ? ingredient.T_Marian === selectedIngredientName
      : ingredient.Ingrediente === selectedIngredientName
  );

 
  if (selectedIngredient) {
    this.ingredientService.selectedIngredients$.pipe(take(1)).subscribe((selectedIngredients) => {
      // Verificar si ya se han seleccionado 4 ingredientes
      if (selectedIngredients.length >= 4) {
        this.snackBar.open('Ya se han seleccionado 4 ingredientes.', '', {
          duration: 3000, // Duración en milisegundos (5 segundos en este caso)
        });
        this.searchText.setValue('');
        return;}

      const isIngredientAlreadySelected = selectedIngredients.some((ingredient) =>
        this.isSpanishMode
          ? ingredient.spanishName === selectedIngredient.T_Marian
          : ingredient.name === selectedIngredient.Ingrediente
      );

      if (!isIngredientAlreadySelected) {
        // Agregar el ingrediente al servicio
        this.ingredientService.addIngredient({
          name: selectedIngredient.Ingrediente,
          spanishName: selectedIngredient.T_Marian,
          selected: true,
        });

        // Limpiar el campo de búsqueda
        this.searchText.setValue('');
        
        this.autocompleteTrigger.updatePosition();
      } else {
        this.searchText.setValue('');
        // console.log('El ingrediente ya está seleccionado.');
      }
    });
  }
}
onEnterPressed(event: Event): void {
  // Prevenir el comportamiento predeterminado del Enter
  event.preventDefault();
  // Agregar cualquier otra lógica que desees ejecutar cuando se presiona Enter
}


}

  

