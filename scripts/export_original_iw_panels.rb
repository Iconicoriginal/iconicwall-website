require 'sketchup.rb'
require 'fileutils'

module IconicWallWebExport
  extend self

  SOURCE = 'C:/Users/utente/iCloudDrive/Iconic/Iconic Wall/Accessori/Accessori 3.skp'.freeze
  OUTPUT = 'C:/Users/utente/Documents/Sito Web/assets/models/original'.freeze
  REPORT = 'C:/Users/utente/Documents/Sito Web/tmp/export_original_iw_panels.txt'.freeze
  NAMES = %w[IconicShelf IconicFrame IconicBox].freeze

  def mm(length)
    (length.to_f * 25.4).round(2)
  end

  def export_components
    model = Sketchup.active_model
    FileUtils.mkdir_p(OUTPUT)
    rows = []

    rows << 'TOP LEVEL:'
    model.entities.each_with_index do |item, index|
      next unless item.is_a?(Sketchup::ComponentInstance) || item.is_a?(Sketchup::Group)
      definition = item.is_a?(Sketchup::ComponentInstance) ? item.definition.name.to_s : ''
      rows << "#{index} | #{item.typename} | instance=#{item.name} | definition=#{definition}"
    end
    rows << ''

    NAMES.each do |name|
      token = name.sub('Iconic', '')
      entity = model.entities.find do |item|
        next false unless item.is_a?(Sketchup::ComponentInstance) || item.is_a?(Sketchup::Group)
        definition = item.is_a?(Sketchup::ComponentInstance) ? item.definition.name.to_s : ''
        [item.name.to_s, definition].any? { |value| value.downcase.include?(token.downcase) }
      end

      if entity.nil?
        definition = model.definitions.find { |item| item.name.to_s.downcase.include?(token.downcase) }
        entity = definition.instances.first if definition
      end

      unless entity
        rows << "#{name}: NON TROVATO"
        next
      end

      model.selection.clear
      model.selection.add(entity)
      target = File.join(OUTPUT, "#{name}.dae")
      options = {
        triangulated_faces: true,
        doublesided_faces: true,
        edges: false,
        texture_maps: true,
        selectionset_only: true,
        preserve_instancing: false
      }
      exported = model.export(target, options)
      bounds = entity.bounds
      rows << [
        name,
        "export=#{exported}",
        "bbox=#{mm(bounds.width)}x#{mm(bounds.depth)}x#{mm(bounds.height)}mm",
        target
      ].join(' | ')
    end

    model.selection.clear
    File.write(REPORT, rows.join("\n"), mode: 'w:utf-8')
    UI.start_timer(2.0, false) { Sketchup.quit }
  rescue => error
    File.write(REPORT, "#{error.class}: #{error.message}\n#{error.backtrace.join("\n")}", mode: 'w:utf-8')
    UI.start_timer(2.0, false) { Sketchup.quit }
  end

  def run
    active = Sketchup.active_model.path.to_s.tr('\\', '/')
    if active.downcase != SOURCE.downcase
      Sketchup.open_file(SOURCE)
      UI.start_timer(12.0, false) { export_components }
    else
      UI.start_timer(3.0, false) { export_components }
    end
  end
end

UI.start_timer(1.0, false) { IconicWallWebExport.run }
