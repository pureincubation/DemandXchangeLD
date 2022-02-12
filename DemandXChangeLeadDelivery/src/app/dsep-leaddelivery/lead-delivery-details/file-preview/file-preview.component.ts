import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'file-preview',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss']
})
export class FilePreviewComponent implements OnInit {
  @Input() message: string = '';
  @Input() subMessage : string = '';
  @Input() showRegenerateLink: boolean = false;
  @Input() disableDownload: boolean = false;
  @Input() disableReplace: boolean = false;
  @Input() disableRegen: boolean = false;
  @Input() disableGen: boolean = false;
  @Output() onDownloadClick = new EventEmitter();
  @Output() onReplaceClick = new EventEmitter();
  @Output() onRegenerateClick = new EventEmitter();
  @Output() onGenerateClick = new EventEmitter();
  @Output() onRefereshClick = new EventEmitter();

  constructor() { }

  ngOnInit() {

  }

  onDownload(event: any){
    this.onDownloadClick.emit(event);
  }

  onReplace(event: any){
    this.onReplaceClick.emit(event);
  }

  onRegenerate(event: any){
    this.onRegenerateClick.emit(event);
  }
  onGenerate(event: any){
    this.onGenerateClick.emit(event);
  }
  onRefreshFile(){
    this.onRefereshClick.emit();
  }

}
