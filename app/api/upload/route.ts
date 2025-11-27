import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth/config";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    // 检查认证
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const directory = (formData.get("directory") as string) || "upload";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // 验证目录
    if (directory !== "root" && directory !== "upload") {
      return NextResponse.json(
        { error: "Invalid directory" },
        { status: 400 }
      );
    }

    // 生成随机文件名
    const fileExtension = path.extname(file.name);
    const randomName = randomBytes(16).toString("hex") + fileExtension;
    
    // 确定保存路径
    const saveDirectory = directory === "root" 
      ? path.join(process.cwd(), "public")
      : path.join(process.cwd(), "public", "upload");
    const filePath = path.join(saveDirectory, randomName);
    const publicPath = directory === "root" 
      ? randomName 
      : `upload/${randomName}`;

    // 确保目录存在
    await mkdir(saveDirectory, { recursive: true });

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 保存文件
    await writeFile(filePath, buffer);

    // 返回文件信息
    return NextResponse.json({
      success: true,
      data: {
        fileName: randomName,
        filePath: publicPath.replace(/\\/g, "/"),
        fileSize: file.size.toString(),
        mimeType: file.type,
        directory: directory as "root" | "upload",
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

