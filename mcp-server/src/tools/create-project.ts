import { promises as fs } from 'fs'
import path from 'path'
import { execSync } from 'child_process'

type Result = {
  project_dir: string
  files: string[]
  build_success: boolean
}

// Recursively copy directory
async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

export async function create_project(args: {
  template: 'erc20-basic' | 'nft-collection' | 'defi-vault' | 'blank'
  project_name: string
  target_dir?: string
}): Promise<Result> {
  const templatesRoot = path.resolve(__dirname, '../../templates')
  const srcDir = path.resolve(templatesRoot, args.template)
  const targetRoot = args.target_dir
    ? path.resolve(args.target_dir)
    : path.resolve('/app/projects', args.project_name)
  const projectDir = path.join(targetRoot, args.project_name)

  // Ensure destination exists and copy
  await copyDir(srcDir, projectDir)

  // Install dependencies and build
  let build_success = false
  try {
    execSync('forge install', { cwd: projectDir, stdio: 'ignore' })
    execSync('forge build', { cwd: projectDir, stdio: 'ignore' })
    build_success = true
  } catch {
    build_success = false
  }

  // Collect file list (relative to projectDir)
  const files: string[] = []
  async function walk(dir: string, base = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const e of entries) {
      const p = path.join(dir, e.name)
      const rel = path.join(base, e.name)
      if (e.isDirectory()) {
        await walk(p, rel)
      } else {
        files.push(rel)
      }
    }
  }
  await walk(projectDir, '')

  return { project_dir: projectDir, files, build_success }
}

export default create_project
