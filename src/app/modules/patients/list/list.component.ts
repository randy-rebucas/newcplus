import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AuthenticationService } from '../../authentication/authentication.service';
import { PatientsService } from '../patients.service';
import { Subscription } from 'rxjs';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { UserService } from 'src/app/shared/services/user.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { FormComponent } from '../form/form.component';

export interface Physicians {
  userId: string;
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  public length: number;
  public perPage: number;
  public currentPage: number;
  public pageSizeOptions: any;
  public isLoading: boolean;
  public userId: string;
  private usersSub: Subscription;

  public displayedColumns: string[] = [
    'image',
    'fullname',
    'contact',
    'gender',
    'birthdate',
    'age',
    'action'
  ];
  public dataSource: MatTableDataSource<any>;
  public selection = new SelectionModel<any>(true, []);
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private notificationService: NotificationService,
    // private authenticationService: AuthenticationService,
    private patientsService: PatientsService,
    private userService: UserService,
  ) {
    this.length = 0;
    this.perPage = 10;
    this.currentPage = 1;
    this.pageSizeOptions = [5, 10, 25, 100];
    this.isLoading = true;
  }

  ngOnInit(): void {
    // this.userId = this.authenticationService.getUserId();

    this.titleService.setTitle('Patients');

    this.patientsService.getAll(this.perPage, this.currentPage);
    this.patientsService.getUpdateListener().subscribe((userData: {patients: any[], counts: number}) => {
      this.isLoading = false;

      const newUsers = [];
      userData.patients.forEach(user => {
        user.physicians.filter((physician: Physicians) => {
          const ownerShip = {
            isOwned : physician.userId === this.userId
          };
          newUsers.push({...user, ...ownerShip});
        });
      });

      this.dataSource = new MatTableDataSource(newUsers);
      this.length = this.dataSource.data.length;

      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onChangedPage(pageData: PageEvent) {
    this.isLoading = true;
    this.currentPage = pageData.pageIndex + 1;
    this.perPage = pageData.pageSize;
    this.patientsService.getAll(this.perPage, this.currentPage);
  }

  onDelete(patientId: string) {
    this.dialogService.openConfirmDialog('Are you sure to delete this record ?')
    .afterClosed().subscribe(dialogRes => {
      if (dialogRes) {
        this.patientsService.delete(patientId).subscribe((patientRes) => {
          // delete related user data
          this.userService.delete(patientRes.id).subscribe(() => {
            this.patientsService.getAll(this.perPage, this.currentPage);
            this.notificationService.warn('::' + patientRes.message);
          });
        });
      }
    });
  }

  onCreate() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '50%';
    dialogConfig.data = {
      id: null,
      title: 'Create New',
      button: 'Save'
    };
    this.dialog.open(FormComponent, dialogConfig).afterClosed().subscribe(() => {
      this.notificationService.success(':: Added successfully');
      this.patientsService.getAll(this.perPage, this.currentPage);
    });
  }

  onEdit(patientId: string) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '50%';
    dialogConfig.data = {
      id: patientId,
      title: 'Update',
      button: 'Update'
    };
    this.dialog.open(FormComponent, dialogConfig).afterClosed().subscribe(() => {
      this.notificationService.success(':: Updated successfully');
      this.patientsService.getAll(this.perPage, this.currentPage);
    });
  }

  onDetail(userId: string) {
    this.router.navigate(['../', userId], {relativeTo: this.activatedRoute});
  }

  onPrint() {}
}
