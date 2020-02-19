import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ListComponent } from './list/list.component';
import { FormComponent } from './form/form.component';
import { DetailComponent } from './detail/detail.component';
import { RecordComponent } from './record/record.component';
import { PatientsComponent } from './patients.component';
import { CanDeactivateGuard } from './can-deactivate.guard';


@NgModule({
  declarations: [ListComponent, FormComponent, DetailComponent, RecordComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: PatientsComponent, children: [
        { path: '', redirectTo: 'list', pathMatch: 'full' },
        { path: 'list', component: ListComponent },
        { path: 'form', component: FormComponent, canDeactivate: [CanDeactivateGuard] },
        { path: ':patientId', component: DetailComponent, children: [
          { path: '', redirectTo: 'records', pathMatch: 'full' },
          { path: 'record', loadChildren: () => import('./record/record.module').then(m => m.RecordModule) },
        ] },
      ] }
    ])
  ]
})
export class PatientsModule { }
