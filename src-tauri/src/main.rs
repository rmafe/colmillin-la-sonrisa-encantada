// Oculta la consola de Windows en la versión de entrega.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  app_lib::run();
}
