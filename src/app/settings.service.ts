import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  
    private useMarianModelSubject = new BehaviorSubject<boolean>(false);
    private useAWSSubject = new BehaviorSubject<boolean>(false);

  

    getUseMarianModel() {
        return this.useMarianModelSubject.asObservable();
      }
    
      getUseAWS() {
        return this.useAWSSubject.asObservable();
      }
    
      // Métodos para actualizar la configuración y notificar cambios
      updateSettings( useMarianModel: boolean, useAWS: boolean) {
        
        this.useMarianModelSubject.next(useMarianModel);
        this.useAWSSubject.next(useAWS);
      }
}
