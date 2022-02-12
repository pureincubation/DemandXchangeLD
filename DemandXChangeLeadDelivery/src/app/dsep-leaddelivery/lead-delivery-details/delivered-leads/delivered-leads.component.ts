import { Component } from "@angular/core";

@Component({
  selector: "delivered-leads",
  templateUrl: "./delivered-leads.component.html",
  styleUrls: ["./delivered-leads.component.scss"],
})
export class DeliveredLeadsComponent {
  values = [
    {
      config: {
        type: "avatar",
        imageSrc: "assets/images/luffy.png",
        text: "Luffy",
        colorCls: "purple",
      },
      header: "CXM",
      subheader: "John Doe",
    },
    {
      config: {
        type: "avatar",
        imageSrc: "assets/images/luffy2.png",
        text: "Luffy 2",
        colorCls: "purple",
      },
      header: "LFC",
      subheader: "Juan Dela Cruz",
    },
    {
      config: {
        type: "icon",
        icon: "groups",
        text: "qwe",
        colorCls: "purple",
      },
      header: "Delivered",
      subheader: "19",
    },
    {
      config: {
        type: "icon",
        icon: "sticky_note_2",
        text: "qwe",
        colorCls: "purple",
      },
      header: "Delivery notes",
      subheader: "Loreum ipsum ................................",
    },
  ];
}
