import {Modal as ModalOriginal} from "bootstrap";

declare module "bootstrap" {
    class Modal extends ModalOriginal {
        _isShown: boolean;
    }
}