import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IngredientResponse } from './ingredient-response.model'; // Ajusta la ruta según la ubicación real


@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private apiUrl = 'https://recipes-gen-z4hma5gvja-no.a.run.app/api';
  // private apiUrl = '/api'

  constructor(private http: HttpClient) {}

  // Método para obtener la lista de ingredientes disponibles
  // getIngredients(pageSize: number): Observable<string[]> {
  //   const url = `${this.apiUrl}/get_ingredients?page_size=${pageSize}`;
  //   return this.http.get<string[]>(url);
  // }

  getIngredients(pageSize: number): Observable<IngredientResponse> {
    const url = `${this.apiUrl}/get_ingredients?page_size=${pageSize}`;
    return this.http.get<IngredientResponse>(url);
  }

  // Método para generar una receta
  generateRecipe(recipeData: any): Observable<any> {
    const url = `${this.apiUrl}/generate-recipe`;
    return this.http.post<any>(url, recipeData);
  }
}
