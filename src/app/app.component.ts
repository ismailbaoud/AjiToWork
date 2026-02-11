import { Component } from "@angular/core";
import { MainLayoutComponent } from "./shared/components/main-layout/main-layout.component";

/**
 * Root application component
 * Uses MainLayoutComponent to provide consistent layout structure
 */
@Component({
  selector: "app-root",
  standalone: true,
  imports: [MainLayoutComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  title = "JobFinder - Find Your Dream Job";
}
