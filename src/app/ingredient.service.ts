import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root', // Esto registra automáticamente el servicio en el módulo raíz
})
export class IngredientService {
     private apiUrl = 'https://recipes-gen-z4hma5gvja-no.a.run.app';
 //private apiUrl = '/api'; // Cambia la URL base a '/api'

  constructor(private http: HttpClient) {}

  // Método para obtener ingredientes paginados
  getIngredients(pageSize: number): Observable<string[]> {
    const url = `${this.apiUrl}/get_ingredients?page_size=${pageSize}`;
    return this.http.get<string[]>(url);
  }

  // Método para buscar ingredientes por término de búsqueda
  searchIngredients(term: string, pageSize: number): Observable<string[]> {
    const url = `${this.apiUrl}/get_ingredients?page_size=${pageSize}&query=${term}`;
    return this.http.get<string[]>(url);
  }

  // Otros métodos y lógica según tus necesidades
}
