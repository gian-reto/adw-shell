{
  description = "AGS-based shell in default libadwaita style";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    ags = {
      url = "github:aylur/ags/83f4895c64b93b4a0993c336be159a7c117406c9";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    ags,
  }: let
    pname = "adw-shell";
    entry = "app.ts";

    supportedSystems = ["x86_64-linux" "aarch64-linux"];
    forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
    pkgsFor = system: nixpkgs.legacyPackages.${system};

    mkExtraPackagesFor = system: let
      pkgs = pkgsFor system;

      astalPackages = with ags.packages.${system}; [
        apps
        astal4
        battery
        bluetooth
        hyprland
        io
        mpris
        network
        notifd
        tray
        wireplumber
      ];
    in
      astalPackages
      ++ [
        pkgs.libadwaita
        pkgs.libsoup_3
      ];

    mkPackagesFor = system: let
      pkgs = pkgsFor system;
      extraPackages = mkExtraPackagesFor system;
    in {
      default = pkgs.stdenv.mkDerivation {
        name = pname;
        src = ./.;

        nativeBuildInputs = with pkgs; [
          wrapGAppsHook
          gobject-introspection
          ags.packages.${system}.default
          makeWrapper
        ];

        buildInputs = extraPackages ++ [pkgs.gjs];

        installPhase = ''
          runHook preInstall

          mkdir -p $out/bin
          mkdir -p $out/share
          cp -r * $out/share
          ags bundle ${entry} $out/bin/${pname} -d "SRC='$out/share'"

          wrapProgram $out/bin/${pname} \
            --prefix PATH : ${pkgs.lib.makeBinPath (with pkgs; [
            # Runtime dependencies.
            dart-sass
          ])}

          runHook postInstall
        '';
      };

      ags = ags.packages.${system}.default;
    };

    mkDevShellFor = system: let
      pkgs = pkgsFor system;
      extraPackages = mkExtraPackagesFor system;
    in {
      default = pkgs.mkShell {
        buildInputs = [
          (ags.packages.${system}.default.override {
            inherit extraPackages;
          })
          pkgs.biome
          pkgs.dart-sass
          pkgs.nodejs
          pkgs.typescript
        ];
      };
    };
  in {
    packages = forAllSystems mkPackagesFor;
    devShells = forAllSystems mkDevShellFor;
  };
}
