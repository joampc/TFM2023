import { Component, OnInit } from '@angular/core';
import { IngredientService } from '../ingredient.service';

@Component({
  selector: 'app-ingredients',
  templateUrl: './ingredients.component.html',
  styleUrls: ['./ingredients.component.css'],
})
export class IngredientsComponent implements OnInit {
  searchTerm: string = '';
  ingredients: string[] = [];
  selectedIngredient: string = '';
  searchResults: string[] = []; // Agrega esta línea

  constructor(private ingredientService: IngredientService) {}

  ngOnInit() {
    // Llamamos al método para obtener ingredientes cuando se inicializa el componente
    this.getIngredients();
  }

  // Método para obtener ingredientes desde el servicio
  getIngredients() {
    const pageSize = 30; // Tamaño de página deseado
    this.ingredientService.getIngredients(pageSize).subscribe((data) => {
      this.ingredients = data;
    });
  }

  // Método para manejar la selección de un ingrediente
  onIngredientSelected(ingredient: string) {
    this.selectedIngredient = ingredient;
  }

  // Método para manejar cambios en el campo de búsqueda
  onInputChange(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    // Aquí puedes realizar acciones adicionales si es necesario
  }

  // Otros métodos del componente para interactuar con el servicio
}

