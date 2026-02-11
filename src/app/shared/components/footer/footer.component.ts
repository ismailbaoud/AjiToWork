import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";

/**
 * Shared footer component for consistent layout across the application
 */
@Component({
  selector: "app-footer",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./footer.component.html",
  styleUrl: "./footer.component.css",
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  /**
   * Navigate to external link
   */
  navigateToExternal(url: string): void {
    window.open(url, "_blank");
  }
}
