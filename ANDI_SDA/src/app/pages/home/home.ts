import { Component } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-home',
  imports: [DividerModule, ButtonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
