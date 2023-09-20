import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecipeGeneratorComponent } from './recipe-generator/recipe-generator.component';
import { IngredientsComponent } from './ingredients/ingredients.component';


const routes: Routes = [
  { path: '', redirectTo: '/generator', pathMatch: 'full' },
  { path: 'generator', component: RecipeGeneratorComponent },
  // { path: 'ingredients', component: IngredientsComponent },
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
