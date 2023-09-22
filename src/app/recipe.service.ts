import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, switchMap, tap } from 'rxjs';
import { IngredientResponse } from './ingredient-response.model'; // Ajusta la ruta según la ubicación real
import { SettingsService } from './settings.service';



@Injectable({
  providedIn: 'root',
})
export class RecipeService {
   private apiUrlGoogle = 'https://fastapi-tensorflow-jxecxsn2la-no.a.run.app/api';
   private apiUrlAWS = 'http://16.171.232.73/api';
   //private apiUrl = 'http://localhost/api'
  private apiUrl = '';
  private useAWS: boolean =false;  // Almacena el valor actual de useAWS

  constructor(private http: HttpClient, private settingsService: SettingsService) {
    // Crea un observable que se actualiza con el valor de useAWS
    const apiUrl$ = this.settingsService.getUseAWS();
   apiUrl$.pipe(
      tap((useAWS) => {
        this.useAWS = useAWS; // Actualiza el valor de useAWS
        this.apiUrl = useAWS ? this.apiUrlAWS : this.apiUrlGoogle;
      })
    ).subscribe();
  }

   
  getIngredients(page: number, pageSize: number, term: string, isSpanishMode: boolean): Observable<any> {
    
   // console.log(this.apiUrl);
    console.log(this.useAWS  ? 'Usando la URL de AWS' : 'Usando la URL de Google');
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
    //console.log(this.apiUrl);
    console.log(this.useAWS  ? 'Usando la URL de AWS' : 'Usando la URL de Google');

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
