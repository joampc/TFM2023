import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SettingsService } from '../settings.service';


@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.css']
})
export class SettingsDialogComponent {
 
  useMarianModel: boolean = false;
  useAWS: boolean = false;

  constructor(public dialogRef: MatDialogRef<SettingsDialogComponent>, 
               private settingsService: SettingsService) {

                this.settingsService.getUseMarianModel().subscribe(useMarianModel => {
                  this.useMarianModel = useMarianModel;
                });
            
                this.settingsService.getUseAWS().subscribe(useAWS => {
                  this.useAWS = useAWS;
                });
          


               }

               saveSettings() {
                this.settingsService.updateSettings(this.useMarianModel, this.useAWS);
                this.dialogRef.close(); // Cierra el diálogo después de guardar la configuración.
              }
              closeDialog() {
                this.dialogRef.close();
              }

}