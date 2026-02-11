import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";

/**
 * Main layout component that wraps the entire application
 * Provides consistent header, footer, and content area structure
 */
@Component({
  selector: "app-main-layout",
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: "./main-layout.component.html",
  styleUrl: "./main-layout.component.css",
})
export class MainLayoutComponent {}
