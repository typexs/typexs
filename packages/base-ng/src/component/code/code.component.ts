import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges,
  ViewChild,
  ViewContainerRef
} from '@angular/core';

declare var Prism: any;
declare var hljs: any;

// <!--<ng-container #></ng-container>-->
// <!--<pre><code class="language-{{language}}" [innerHTML]="content | safeHtml"></code></pre>-->


@Component({
  selector: 'txs-code',
  templateUrl: 'code.component.html',
  styleUrls: ['./code.component.scss']
})
export class CodeComponent implements OnChanges, AfterViewInit {

  @Input()
  loading: boolean;

  @Input()
  content: string;

  @Input()
  language: string;

  @Input()
  scrollBottom: boolean;

  initialized = false;

  logOutput: HTMLElement;

  constructor(private element: ElementRef, private renderer: Renderer2) {
  }

  getRootElement() {
    if (!this.logOutput) {
      this.logOutput = this.element.nativeElement.querySelector('.log-output') as HTMLElement;
    }
    return this.logOutput;
  }

  /**
   * Cleanup and recreate code element
   */
  reload() {
    const cl = this.getRootElement().childNodes;
    for (let i = 0; i < cl.length; i++) {
      const node = cl.item(i);
      this.getRootElement().removeChild(node);
    }
    const el = this.createElement();
    this.getRootElement().appendChild(el);
    this.highlightElement(el.querySelector('code'));
    if(this.scrollBottom){
      setTimeout(() => {
        const parent = this.getRootElement().parentElement;
        parent.scrollTop = parent.scrollHeight;
      }, 10);
    }
  }

  createElement() {
    const el = this.renderer.createElement('pre') as HTMLElement;
    const code = this.renderer.createElement('code') as HTMLElement;
    el.appendChild(code);
    code.classList.add('language-' + this.language);
    code.innerHTML = this.content;
    return el;
  }

  highlightElement(el: HTMLElement) {
    if (typeof Prism !== 'undefined' && Prism.highlightElement) {
      Prism.highlightElement(el);
    } else if (typeof hljs !== 'undefined' && hljs.highlightElement) {
      hljs.highlightElement(el);
    }
  }

  // highlightAll() {
  //   if (typeof Prism !== 'undefined' && Prism.highlightAll) {
  //     Prism.highlightAll();
  //   } else if (typeof hljs !== 'undefined' && hljs.highlightAll) {
  //     hljs.highlightAll();
  //   }
  // }
  //
  ngAfterViewInit() {
    // this.highlightAll()
    this.initialized = true;
    this.reload();


  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.initialized) {
      if (changes['content'] && !changes['content'].isFirstChange()) {
        this.reload();
      }
    }
  }
}
