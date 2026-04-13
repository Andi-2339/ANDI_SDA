import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, ButtonModule, RippleModule, DividerModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing {}
