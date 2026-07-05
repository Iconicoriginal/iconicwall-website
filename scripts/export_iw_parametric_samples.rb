require 'sketchup.rb'
require 'fileutils'

module IconicWallSampleExport
  extend self

  SOURCE = 'C:/Users/utente/AppData/Local/Temp/IWAnalysis2.skp'.freeze
  OUTPUT = 'C:/Users/utente/Documents/Sito Web/assets/models/samples'.freeze
  REPORT = 'C:/Users/utente/Documents/Sito Web/tmp/iw_parametric_samples.txt'.freeze

  def mm(value)
    (value.to_f * 25.4).round(1)
  end

  def safe_name(value)
    cleaned = value.to_s.gsub(/[^0-9A-Za-z_-]+/, '_').gsub(/^_+|_+$/, '')
    cleaned.empty? ? 'unnamed' : cleaned
  end

  def entity_name(entity)
    definition = entity.is_a?(Sketchup::ComponentInstance) ? entity.definition.name.to_s : ''
    [entity.name.to_s, definition].reject(&:empty?).join('__')
  end

  def candidate?(dimensions)
    dimensions.any? { |value| (value - 300).abs < 2 || (value - 600).abs < 2 } &&
      dimensions.any? { |value| (value - 450).abs < 2 || (value - 600).abs < 2 || (value - 750).abs < 2 }
  end

  def run
    model = Sketchup.active_model
    FileUtils.mkdir_p(OUTPUT)
    rows = ["SOURCE: #{model.path}", '']

    model.entities.each_with_index do |entity, index|
      next unless entity.is_a?(Sketchup::ComponentInstance) || entity.is_a?(Sketchup::Group)

      bounds = entity.bounds
      dimensions = [mm(bounds.width), mm(bounds.depth), mm(bounds.height)]
      name = entity_name(entity)
      rows << "#{index} | #{entity.typename} | #{name} | bbox=#{dimensions.join(' x ')}"
      next unless candidate?(dimensions)

      model.selection.clear
      model.selection.add(entity)
      filename = format(
        '%02d_%s_%sx%sx%s.dae',
        index,
        safe_name(name),
        *dimensions.map { |value| value.to_s.tr('.', '-') }
      )
      target = File.join(OUTPUT, filename)
      exported = model.export(
        target,
        triangulated_faces: true,
        doublesided_faces: true,
        edges: false,
        texture_maps: true,
        selectionset_only: true,
        preserve_instancing: false
      )
      rows << "  EXPORT=#{exported} | #{target}"
    end

    model.selection.clear
    File.write(REPORT, rows.join("\n"), mode: 'w:utf-8')
    UI.start_timer(2.0, false) { Sketchup.quit }
  rescue => error
    File.write(REPORT, "#{error.class}: #{error.message}\n#{error.backtrace.join("\n")}", mode: 'w:utf-8')
    UI.start_timer(2.0, false) { Sketchup.quit }
  end

  def start
    active = Sketchup.active_model.path.to_s.tr('\\', '/')
    if active.downcase != SOURCE.downcase
      Sketchup.open_file(SOURCE)
      UI.start_timer(12.0, false) { run }
    else
      UI.start_timer(3.0, false) { run }
    end
  end
end

UI.start_timer(1.0, false) { IconicWallSampleExport.start }
