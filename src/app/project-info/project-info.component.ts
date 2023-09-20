import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-project-info',
  templateUrl: './project-info.component.html',
  styleUrls: ['./project-info.component.css']
})
export class ProjectInfoComponent {
  fileInfo: string | undefined; // Esto contendrá el contenido del archivo

  constructor(private http: HttpClient) {
    this.http.get('assets/project_info.html', {responseType: 'text'}).subscribe(data => {
      this.fileInfo = data;
    });
  }
}
