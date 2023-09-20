// import { Injectable } from '@angular/core';

import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

// @Injectable({
//   providedIn: 'root',
// })
// export class IngredientService {
//   selectedIngredients: any[] = [];

//   constructor() {}
  
 
// } 
@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private _selectedIngredients = new BehaviorSubject<any[]>([]);
  selectedIngredients$ = this._selectedIngredients.asObservable();

  constructor() {}

  addIngredient(ingredient: any) {
    const currentIngredients = this._selectedIngredients.getValue();
    const updatedIngredients = [...currentIngredients, ingredient];
    this._selectedIngredients.next(updatedIngredients);
  }

  removeIngredient(ingredient: any) {
    const currentIngredients = this._selectedIngredients.getValue();
    const updatedIngredients = currentIngredients.filter(i => i !== ingredient);
    this._selectedIngredients.next(updatedIngredients);
  }

  clearIngredients() {
    this._selectedIngredients.next([]);
  }

  updateSelectedIngredients(ingredients: any[]) {
    this._selectedIngredients.next(ingredients);
  }
}
