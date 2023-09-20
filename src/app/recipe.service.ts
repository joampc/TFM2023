import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IngredientResponse } from './ingredient-response.model'; // Ajusta la ruta según la ubicación real


@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private apiUrl = 'https://fastapi-tensorflow-jxecxsn2la-no.a.run.app/api';
  // private apiUrl = 'http://localhost/api'

  constructor(private http: HttpClient) {}


  // getIngredients(page: number, pageSize: number, term: string, isSpanishMode: boolean): Observable<any> {
   
  //   const startIndex = (page - 1) * pageSize;
  //   const endIndex = startIndex + pageSize;
  //   console.log('del servicio', term)
  //   // Construye los parámetros de la solicitud
  //   const params = new HttpParams()
  //     .set('page', page)
  //     .set('page_size', pageSize)
  //     .set('term', term)
  //     .set('is_spanish_mode', isSpanishMode ? 'true' : 'false');
  
  //   // Realiza la solicitud HTTP con los parámetros
  //   // Asegúrate de ajustar la URL según tus necesidades.
  //   const url = `${this.apiUrl}/get_ingredients`;
  //   return this.http.get(url, { params });
  // }
  
  getIngredients(page: number, pageSize: number, term: string, isSpanishMode: boolean): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString())
      .set('term', term)
      .set('is_spanish_mode', isSpanishMode ? 'true' : 'false');
  
    const url = `${this.apiUrl}/get_ingredients`;
    return this.http.get<{ingredientes: any[], total_items: number}>(url, { params });
  }


 searchIngredients(term: string, pageSize: number): Observable<IngredientResponse> {
  const url = `${this.apiUrl}/get_ingredients?page_size=${pageSize}&query=${term}`;
  return this.http.get<IngredientResponse>(url);
}


  // Método para generar una receta
  generateRecipe(recipeData: any): Observable<any> {
    const url = `${this.apiUrl}/generate-recipe`;
    return this.http.post<any>(url, recipeData);
  }

  generateRecipeWithTranslation(recipeData: any): Observable<any> {
    const url = `${this.apiUrl}/generate-recipe-with-translation`; // Asegúrate de que esta sea la ruta correcta en tu API
    return this.http.post<any>(url, recipeData);
  }


   // Método para traducir texto
  translateTextGoogle(text: string): Observable<any> {
    const url = `${this.apiUrl}/Gtranslate`;

    // Define los datos que se enviarán en el cuerpo de la solicitud POST
    const requestBody = { text: text };

    // Realiza la solicitud POST a la API
    return this.http.post<any>(url, requestBody);
  }

  translateTextMarian(text: string): Observable<any> {
    const url = `${this.apiUrl}/Mtranslate`;

    // Define los datos que se enviarán en el cuerpo de la solicitud POST
    const requestBody = { text: text };

    // Realiza la solicitud POST a la API
    return this.http.post<any>(url, requestBody);
  }
}
